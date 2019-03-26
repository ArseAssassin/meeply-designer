let { measureSVGText } = require('utils/layoutUtils.js'),
    { memoizedFunction } = require('utils/functionUtils.js')

const
    FONT_FAMILY = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif',
    SPACE = '\u00A0',
    MARGIN = 30

module.exports = memoizedFunction(
    ({ x, y, isInverted, children, height, width, helperClass, isBold, fontStyle, fontFamily, loadedFonts, ...props }) => {
        if (!children) {
            return null
        }

        let availableWidth = (isInverted ? height : width) - MARGIN,
            ratio = !isInverted ? 0 : height - width,
            style = `font-size: ${props.style.fontSize}; font-style: ${fontStyle}; font-weight: ${isBold ? 'bold' : ''}; font-family: '${JSON.stringify(fontFamily || FONT_FAMILY)}';`,
            spaceWidth = measureSVGText(SPACE, helperClass, style)[0][0].width,
            content = threadLast(measureSVGText(children, helperClass, style))(
                r.map(r.reduce(
                    (memo, it) => {
                        let last = r.last(memo),
                            takenWidth = r.sum(last.map(r.prop('width'))) + last.length * spaceWidth

                        if (it.width + takenWidth < availableWidth || (it.width > availableWidth && last.length === 0)) {
                            return r.init(memo).concat([last.concat(it)])
                        } else {
                            return memo.concat([[it]])
                        }
                    },
                    [[]]
                )),
                r.unnest,
                r.filter(r.prop('length')),
                r.addIndex(r.map)((it, idx) =>
                    <tspan x={ x + width / 2 } y={ y + ratio / 2 + it[0].height * (idx + 1)} key={ idx }>
                        { it.map(r.prop('word')).join(SPACE) }
                    </tspan>
                )
            )

        return <text
            fontWeight={ isBold ? 'bold' : undefined }
            fontStyle={ fontStyle }
            data-is-loaded={ !fontFamily || r.contains(fontFamily, loadedFonts) }
            style={{ fontFamily: fontFamily ? JSON.stringify(fontFamily) : FONT_FAMILY, ...props.style }}
            { ...r.omit(['style'], props) }>{ content }</text>
    }
)
