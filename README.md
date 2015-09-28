# ansi-blit

```
DISPLAYS IMAGES IN YOUR SHELL! (╯°□°）╯︵ ┻━┻
```
Install:
```
$ npm install -g ansi-blit
```

Use:
```
Usage:
  blit [OPTIONS] FILENAME

Options:
      --mode [STRING]         Display mode: full|tile|randomtile (Default is full)
      --showbounds           Scale image to console width (Default is false)
      --tilewidth [NUMBER]    Width of tiles (Default is 64)
      --tileheight [NUMBER]   Height of tiles (Default is 64)
      --tilerow NUMBER      Row of tile to display (Default is 0)
      --tilecolumn NUMBER   Column of tile to display (Default is 0)
```

Examples:
```
# display a random tile on login
$ echo "blit --mode randomtile sprites.png" >> ~/.bashrc
```
```
# continuously display random tiles
$ while :; do blit --mode randomtile sprites.png; done
```
```
# display the 2nd tile on the 3rd row, using 16x16 tiles
$ blit --mode tile -w 16 -h 16 -row 3 -col 2 -col sprites.png; done
```
