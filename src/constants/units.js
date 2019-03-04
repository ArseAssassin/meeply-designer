const
    DEFAULT_PPI = 92,
    INCH = 1,
    PAPER_SIZES = {
        A4: [8.3, 11.7],
        ANSI_LETTER: [8.5, 11]
    },
    A4_PIXELS = [DEFAULT_PPI * 8.3, DEFAULT_PPI * 11.7],
    ANSI_LETTER_PIXELS = [DEFAULT_PPI * 8.5, DEFAULT_PPI * 11]

module.exports = {
    DEFAULT_PPI,
    INCH,
    PAPER_SIZES,
    A4_PIXELS,
    ANSI_LETTER_PIXELS
}
