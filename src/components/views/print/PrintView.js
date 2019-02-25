let gameModel = require('model/gameModel.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    { DEFAULT_PPI, A4_PIXELS } = require('constants/units.js'),
    Input = require('components/common/Input.js'),

    Button = require('components/common/Button.js')

require('./print-view.styl')

let CANVAS_WIDTH = A4_PIXELS[0],
    CANVAS_HEIGHT = A4_PIXELS[1]

module.exports = switchboard.component(
    ({ signal, slot }) => {
        return ({
            elements: gameModel.elements.populateTemplate(gameModel.elements.signal),
            pageMargin: signal(20, slot('margin.set')),
            showCutlines: signal(true, slot('showCutlines.set')),
            showCropMarks: signal(true, slot('showCropMarks.set'))
        })
    },

    ({ wiredState: { elements, pageMargin, showCutlines, showCropMarks }, wire }) => {
        let pages = threadLast(elements)(
            r.map((it) => r.repeat(it, it.count)),
            r.unnest,
            r.groupBy((it) => it.width + '-' + it.height),
            r.mapObjIndexed((it) => {
                let { width, height } = it[0],
                    actualCanvasWidth = CANVAS_WIDTH - pageMargin * 2,
                    actualCanvasHeight = CANVAS_HEIGHT - pageMargin * 2,
                    hElements = Math.floor(actualCanvasWidth / width),
                    vElements = Math.floor(actualCanvasHeight / height),
                    allowedElements = hElements * vElements,
                    elementMarginWidth = actualCanvasWidth / hElements + (actualCanvasWidth / hElements - width) / hElements,
                    elementMarginHeight = actualCanvasHeight / vElements + (actualCanvasHeight / vElements - height) / vElements

                return threadLast(it)(
                    r.splitEvery(allowedElements),
                    r.map(r.addIndex(r.map)((it, idx) => ({
                        ...it,
                        x: pageMargin + (idx % hElements) * elementMarginWidth,
                        y: pageMargin + (Math.floor(idx / hElements)) * elementMarginHeight
                    })))
                )
            }),
            r.toPairs,
            r.sortBy(r.head),
            r.reverse
        )

        return <div className='print'>
            <div className='print__tools'>
                <VGroup>
                    <span>Page count: { pages.reduce((memo, [_, pages]) => memo + pages.length, 0) }</span>

                    <Button modifiers='blue l' onClick={ () => window.print() }>Print game</Button>

                    <HGroup modifiers='justify-center'>
                        <Input.Number
                            onChange={ r.pipe(r.path(words('target value')), parseInt, wire('margin.set')) }
                            label='Page margin'
                            value={ pageMargin } />

                        <Input.Checkbox
                            checked={ showCropMarks }
                            onChange={ r.pipe(r.path(words('target checked')), wire('showCropMarks.set')) }
                            label='Show crop marks' />

                        <Input.Checkbox
                            checked={ showCutlines }
                            onChange={ r.pipe(r.path(words('target checked')), wire('showCutlines.set')) }
                            label='Show cutlines' />
                    </HGroup>
                </VGroup>
            </div>

            <div id='print'>
                { threadLast(pages)(
                    r.addIndex(r.map)(([size, pages], idx) => pages.map((page) =>
                        <svg viewBox={`0 0 ${A4_PIXELS.join(' ')}`} width={ A4_PIXELS[0] } height={ A4_PIXELS[1] } key={ size + idx } className='print__page'>
                            {page.map((it) => {
                                let left = it.x,
                                    lefter = Math.max(0, ...page.map((it) => it.x + it.width).filter((it) => it < left)),
                                    top = it.y,
                                    topper = Math.max(0, ...page.map((it) => it.y + it.height).filter((it) => it < top)),
                                    right = it.x + it.width,
                                    righter = Math.min(CANVAS_WIDTH, ...page.map((it) => it.x).filter((it) => it > right)),
                                    bottom = it.y + it.height,
                                    bottomer = Math.min(CANVAS_HEIGHT, ...page.map((it) => it.y).filter((it) => it > bottom))

                                return <g>
                                    {showCropMarks && [[left, top, lefter, top], [left, top, left, topper], [right, top, right, topper], [right, top, righter, top], [left, bottom, lefter, bottom], [left, bottom, left, bottomer], [right, bottom, righter, bottom], [right, bottom, right, bottomer]].map((it) =>
                                            <polyline
                                                key={ it.join(' ') }
                                                className='print__guide'
                                                points={ r.splitEvery(2, it).map((it) => it.join(',')).join(' ') } />
                                    ) }

                                    <ElementRenderer
                                        x={ it.x }
                                        y={ it.y }
                                        key={ it.id }
                                        useExactSize
                                        showDocument={ showCutlines }
                                        element={ it }
                                        realTime
                                        style={{ width: it.width / DEFAULT_PPI + 'in', height: it.height / DEFAULT_PPI + 'in' }}
                                        viewBox={ `0 0 ${ it.width } ${ it.height }`} />
                                </g>
                            })}
                        </svg>
                    ))
                ) }
            </div>
        </div>
    }
)
