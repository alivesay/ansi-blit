# ansi-blit

```
DISPLAYS IMAGES IN YOUR SHELL! (╯°□°）╯︵ ┻━┻
```
![](http://i.imgur.com/NKR9mfx.png)

Demonstration above provided for educational purposes only using [this](http://veekun.com/static/pokedex/downloads/generation-3.png) source image.

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
      --showbounds            Scale image to console width (Default is false)
      --tilewidth [NUMBER]    Width of tiles (Default is 64)
      --tileheight [NUMBER]   Height of tiles (Default is 64)
      --tilerow NUMBER        Row of tile to display (Default is 0)
      --tilecolumn NUMBER     Column of tile to display (Default is 0)
```

Examples:
```
# display a random tile on login
$ echo "blit --mode randomtile sprites.png" >> ~/.bashrc
```
```
# 5% chance of random display on login
$ echo "(((($RANDOM % 100) + 1) <= 5)) && blit --mode randomtile sprites.png" >> ~/.bashrc
```
```
# continuously display random tiles
$ while :; do blit --mode randomtile sprites.png; done
```
```
# display the 2nd tile on the 3rd row, using 16x16 tiles
$ blit --mode tile -w 16 -h 16 -row 3 -col 2 -col sprites.png; done
```
