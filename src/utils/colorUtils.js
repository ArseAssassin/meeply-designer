let zeroPad = (it, length, padding) =>
    it.length < length
        ? zeroPad(padding + it, length, padding)
        : it

module.exports = {
    rgbaToCss: (it) =>
        !it
          ? 'transparent'
          : `rgba(${it.r}, ${it.g}, ${it.b}, ${it.a})`,

    rgbToHex: (it) =>
        !it
          ? 'transparent'
          : '#' + [it.r, it.g, it.b]
            .map((it) => zeroPad(it.toString(16), 2, '0'))
            .join('')
}
