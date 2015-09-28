var _ = require('lodash');
var ansi = require('ansi');
var Jimp = require('jimp');
var os = require('os');
var cursor = ansi(process.stdout);
var createNamespace = require('continuation-local-storage').createNamespace;
var ns = createNamespace('ns');
var shuffle = require('fisher-yates');

var DEFAULT_OPTIONS = {
    mode: 'full',
    tilerow: 0,
    tilecolumn: 0,
    tilewidth: 64,
    tileheight: 64,
    showbounds: false
};

var VALID_MODES = [ 'full', 'tile', 'randomtile' ];

var BITWISE = (os.endianess == 'LE') ? {
    AMASK: 0xff000000,
    BMASK: 0x00ff0000,
    GMASK: 0x0000ff00,
    RMASK: 0x000000ff,
    RGBMASK: 0x00ffffff,
    ASHIFT: 24,
    BSHIFT: 16,
    GSHIFT: 8,
    RSHIFT: 0
} : {
    AMASK: 0x000000ff,
    BMASK: 0x0000ff00,
    GMASK: 0x00ff0000,
    RMASK: 0xff000000,
    RGBMASK: 0xffffff00,
    ASHIFT: 0,
    BSHIFT: 8,
    GSHIFT: 16,
    RSHIFT: 24
};

function _getTile(tilesheet, options, callback) {
    var sx, sy, sw, sh;
    var dw, dh;
    var tileCols = tilesheet.bitmap.width / options.tilewidth;
    var tileRows = tilesheet.bitmap.height / options.tileheight;
    var tileCount = tileCols * tileRows;

    switch (options.mode) {
        case 'tile':
            sx = options.tilecolumn * options.tilewidth;
            sy = options.tilerow * options.tileheight;
            sw = dw = options.tilewidth;
            sh = dh = options.tileheight;
            break;

        case 'randomtile':
            var randomTiles = ns.get('randomTiles');
            if (randomTiles === undefined) {
                randomTiles = shuffle(_.range(0, tileCount));
            }
            var randomIndex = randomTiles.pop();
            ns.set('randomTiles', randomTiles);
            if (randomIndex === undefined) {
                return callback('no visible tiles found!', null);
            }
            
            sx = (randomIndex % tileCols) * options.tilewidth;
            sy = ((randomIndex / tileCols) >> 0) * options.tileheight;
            sw = dw = options.tilewidth;
            sh = dh = options.tileheight;
            break;

        default:
            sx = sy = 0;
            sw = dw = tilesheet.bitmap.width;
            sh = dh = tilesheet.bitmap.height;
            break;
    }

    new Jimp(dw, dh, function (err, tile) {
        if (err) {
            return callback(err, null);
        }

        tilesheet.scan(sx, sy, sw, sh, function (x, y, sidx) {
            var didx = ((dw * (y - sy)) + x - sx) << 2;
            tile.bitmap.data.writeUInt32BE(tilesheet.bitmap.data.readUInt32BE(sidx), didx);
        });

        return callback(null, tile);
    });
}

function _getBounds(image) {
    var maxWidth = Math.min(image.bitmap.width, process.stdout.columns >> 1);
    
    var bounds = {
        top: image.bitmap.height,
        left: maxWidth,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
    };
   
    for (var by = 0; by < image.bitmap.height; by++) {
        for (var bx = 0; bx < image.bitmap.width; bx++) {
            if (image.bitmap.data[(((image.bitmap.width * by) + bx) << 2) + 3] > 0) {
                bounds.top = Math.min(bounds.top, by);
                bounds.left = Math.min(bounds.left, bx);
                bounds.right = Math.max(bounds.right, bx);
                bounds.bottom = Math.max(bounds.bottom, by);
            }
        }
    }
    
    bounds.right = Math.min(maxWidth + bounds.left - 1, bounds.right);
    bounds.width = bounds.right - bounds.left + 1;
    bounds.height = bounds.bottom - bounds.top + 1;
    
    return (bounds.right && bounds.bottom) ? bounds : null;
}

function _isBoundingEdge(bounds, x, y) {
    return bounds.top === y || bounds.right === x || bounds.bottom === y || bounds.left === x;
}

function _blit(tilesheet, options, callback) {

    function getTileCallback (err, tile) {
        if (err) {
            return callback(err);
        }

        var bounds = _getBounds(tile);
        
        if (!bounds) {
            if (options.mode === 'randomtile') {
                /* keep trying until random tile permutations are exhuasted */
                return _blit(tilesheet, options, callback);
            }

            return callback('no visible pixels in tile!');
        }
       
        /* disable line wrapping */ 
        process.stdout.write('\033[?7l');
        
        tile.scan(bounds.left, bounds.top, bounds.width, bounds.height, function (x, y, idx) {
            var data = tile.bitmap.data; 

            /* will draw */
            if (x <= bounds.right) {
                /* if not transparent... */
                var pixel = tile.bitmap.data.readUInt32BE(idx); /* Jimp is big endian */

                if (pixel & BITWISE.AMASK) {
                    /* set color */
                    cursor.bg.rgb(pixel >> BITWISE.RSHIFT & 0xff,
                                  pixel >> BITWISE.GSHIFT & 0xff,
                                  pixel >> BITWISE.BSHIFT & 0xff);
                } else {
                    /* use default background color */
                    cursor.bg.reset();
                }
                
                /* maybe draw bounding box */
                if (options.showbounds && _isBoundingEdge(bounds, x, y)) {
                    cursor.bg.rgb(0xff, 0x00, 0xff);
                }

                /* draw pixel */
                cursor.write('  ');
            }

            /* new line */
            if (x === bounds.right) {
                cursor.bg.reset();
                cursor.write('\n');

                /* done drawing */
                if (idx === data.length - 1) {
                    cursor.write('\n').reset();

                    /* enable line wrapping */
                    process.stdout.write('\033[?7h');

                    return callback(null);
                }
                return;
            }
        });
    }

    _getTile(tilesheet, options, getTileCallback);

}

function blit(filename, options, callback) {
    options = _.defaultsDeep(options, DEFAULT_OPTIONS);

    if (!_.includes(VALID_MODES, options.mode)) {
        return callback('invalid mode: ' + options.mode);
    }

    new Jimp(filename, function (err, tilesheet) {
        if (err) {
            return callback(err);
        }

        return ns.run(function () {
            return _blit(tilesheet, options, callback);
        });
    });
}

module.exports = {
    defaultOptions: DEFAULT_OPTIONS,
    validModes: VALID_MODES,
    blit: blit
};
