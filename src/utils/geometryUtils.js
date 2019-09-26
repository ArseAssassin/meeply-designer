module.exports = {
    hexagon: (x, y, width, height) =>
        [[0, height / 2], [width / 4, 0], [width / 4 * 3, 0], [width, height / 2], [width / 4 * 3, height], [width / 4, height], [0, height / 2]].map(([x0, y0]) => [x + x0, y + y0])
}
