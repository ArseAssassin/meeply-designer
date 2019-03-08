let gameModel = require('model/gameModel.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    { DEFAULT_PPI, PAPER_SIZES } = require('constants/units.js'),
    Input = require('components/common/Input.js'),
    Modal = require('components/common/Modal.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    FileFace = require('components/common/FileFace.js'),
    persistentSignal = require('model/persistentSignal.js'),
    saveTabState = require('wireState/saveTabState.js'),

    Button = require('components/common/Button.js')

require('./print-view.styl')

module.exports = switchboard.component(
    saveTabState(({ savedSignal, signal, slot }) => {
        let pSignal = persistentSignal(signal)

        return ({
            elements: gameModel.elements.populateTemplate(gameModel.elements.signal),
            pageMargin: pSignal('pageMargin', 20, slot('margin.set')),
            showCutlines: pSignal('showCutlines', true, slot('showCutlines.set')),
            showCropMarks: pSignal('showCropMarks', true, slot('showCropMarks.set')),
            selectorShown: signal(false, slot('selector.toggle'), r.not),
            paperSize: pSignal('paperSize', 'A4', slot('paperSize.set')),
            cardBackMode: pSignal('cardBackMode', 'none', slot('cardBackMode.set')),
            decks:
                gameModel.elements.populateTemplate(gameModel.elements.signal.map(r.filter((it) => !it.template))),
            counts:
                gameModel.elements.counts,

            selectedComponents: savedSignal('selectedPrintComponents')(
                [],

                gameModel.elements.signal.map(r.map(r.prop('id'))),

                slot('selection.toggle'),
                (it, id) =>
                    !r.contains(id, it)
                        ? it.concat(id)
                        : it.filter((it) => it !== id),

                kefir.combine(
                    [slot('selection.componentSet.toggle')],
                    [gameModel.elements.signal]
                ),
                (it, [[id, status], elements]) =>
                    status
                        ? r.uniq(it.concat(elements.filter((it) => it.id === id || it.template === id).map(r.prop('id'))))
                        : it.filter((it) => {
                            let component = r.find(r.propEq('id', it), elements)

                            return component.template !== id && component.id !== id
                        })
            )
        })
    }),

    ({ wiredState: { elements, cardBackMode, paperSize, decks, counts, pageMargin, showCutlines, selectedComponents, showCropMarks, selectorShown }, wire }) => {
        let [canvasWidth, canvasHeight] = PAPER_SIZES[paperSize].map((it) => it * DEFAULT_PPI),
            pages = threadLast(elements)(
                r.filter((it) => r.contains(it.id, selectedComponents)),
                r.map((it) => r.repeat(it, it.count)),
                r.unnest,
                r.groupBy((it) => it.width + '-' + it.height),
                r.mapObjIndexed((it) => {
                    let { width, height } = it[0],
                        requiredWidth = cardBackMode === 'fold' ? width * 2 : width,
                        actualCanvasWidth = canvasWidth - pageMargin * 2,
                        actualCanvasHeight = canvasHeight - pageMargin * 2,
                        hElements = Math.floor(actualCanvasWidth / requiredWidth),
                        vElements = Math.floor(actualCanvasHeight / height),
                        allowedElements = hElements * vElements,
                        elementMarginWidth = (actualCanvasWidth - hElements * requiredWidth) / Math.max(1, hElements - 1) + requiredWidth,
                        elementMarginHeight = (actualCanvasHeight - vElements * height) / Math.max(1, vElements - 1) + height

                    return threadLast(it)(
                        r.splitEvery(allowedElements),
                        r.map(r.pipe(
                            r.addIndex(r.map)((it, idx) => [
                                {
                                    ...it,
                                    x: pageMargin + (idx % hElements) * elementMarginWidth,
                                    y: pageMargin + (Math.floor(idx / hElements)) * elementMarginHeight,
                                    disabledGuides:
                                        cardBackMode === 'fold'
                                            ? ['ne', 'se']
                                            : []
                                },
                                cardBackMode === 'fold'
                                  ? {
                                        ...it,
                                        x: pageMargin + (idx % hElements) * elementMarginWidth + width,
                                        y: pageMargin + (Math.floor(idx / hElements)) * elementMarginHeight,
                                        isBack: true,
                                        disabledGuides: ['nw', 'sw']
                                    }
                                  : undefined
                            ].filter(Boolean)),
                            r.unnest,
                            (it) => [
                                cardBackMode !== 'only' ? it : undefined,
                                r.contains(cardBackMode, words('sheet only duplex'))
                                  ? threadLast(it)(
                                        r.map((it) => ({
                                            ...it,
                                            x: cardBackMode === 'duplex'
                                                ? it.x * -1 - it.width + canvasWidth
                                                : it.x,
                                            isBack: true
                                        }))
                                    )
                                  : undefined
                            ].filter(Boolean)
                        )),
                        r.unnest
                    )
                }),
                r.toPairs,
                r.sortBy(r.head),
                r.reverse
            )

        return <div className={ modifiersToClass('print', paperSize.toLowerCase()) }>
            <div className='print__tools'>
                <VGroup>
                    <span>Page count: { pages.reduce((memo, [_, pages]) => memo + pages.length, 0) }</span>

                    <Button modifiers='blue l' onClick={ () => window.print() }>Print game</Button>

                    <VGroup>
                        <HGroup modifiers='justify-center align-center'>
                            <Input.Select label='Paper size' value={ paperSize } onChange={ r.pipe(r.path(words('target value')), wire('paperSize.set')) }>
                                <option value='A4'>A4</option>
                                <option value='ANSI_LETTER'>Letter (8.5" x 11")</option>
                            </Input.Select>

                            <Input.Select
                                label='Card back printing'
                                value={ cardBackMode }
                                onChange={ r.pipe(r.path(words('target value')), wire('cardBackMode.set'))}>
                                <option value='none'>Not printed</option>
                                <option value='fold'>Folded</option>
                                <option value='sheet'>By sheet</option>
                                <option value='duplex'>Duplex</option>
                                <option value='only'>Only backs</option>
                            </Input.Select>

                            <Input.Number
                                label='Page margin'
                                onChange={ r.pipe(r.path(words('target value')), parseInt, wire('margin.set')) }
                                value={ pageMargin } />
                        </HGroup>

                        <HGroup modifiers='justify-center align-center'>
                            <Input.Checkbox
                                checked={ showCropMarks }
                                onChange={ r.pipe(r.path(words('target checked')), wire('showCropMarks.set')) }
                                label='Show crop marks' />

                            <Input.Checkbox
                                checked={ showCutlines }
                                onChange={ r.pipe(r.path(words('target checked')), wire('showCutlines.set')) }
                                label='Show cutlines' />

                            <HGroup modifiers='margin-s align-center'>
                                Printing
                                <Button modifiers='aqua s' onClick={ wire('selector.toggle') }>
                                    <HGroup modifiers='align-center margin-s'>
                                        { selectedComponents.length === elements.length
                                            ? 'all components'
                                            : `${ selectedComponents.length } components` }
                                        <Icon name='edit' modifiers='s' />
                                    </HGroup>
                                </Button>
                            </HGroup>
                        </HGroup>
                    </VGroup>
                </VGroup>
            </div>

            <Modal
                isOpen={ selectorShown }
                heading='Select components to print'
                onClose={ wire('selector.toggle') }>
                <div className='print__selector'>
                    <FileExplorer
                        rootName={ <Icon name='home' modifiers='s' /> }>

                        { decks.map(({ name, id, ...deck }) =>
                            <FileExplorer.Folder
                                face={
                                    <div className='design-view__file'>
                                        <ElementRenderer
                                            element={ deck }
                                            viewBox={ `0 0 ${ deck.width } ${ deck.height }`}
                                            showDocument />

                                        <div className='design-view__meta'>
                                            <Input.Checkbox
                                                onChange={ r.pipe(r.path(words('target checked')), r.pair(id), wire('selection.componentSet.toggle')) }
                                                checked={ r.all(
                                                    (it) => r.contains(it.id, selectedComponents),
                                                    elements.filter((it) => it.template === id || it.id === id)
                                                ) }
                                                modifiers='l' />
                                        </div>
                                    </div>
                                }
                                label={ <HGroup modifiers='margin-s'>
                                    {name}
                                    <HGroup modifiers='margin-xs align-center'>
                                        <Icon name='count' modifiers='s' />
                                        { counts[id] }
                                    </HGroup>
                                </HGroup> }
                                { ...FileFace.params({ name, id, ...deck }) }
                                key={ id }>
                                { elements.filter((it) => r.contains(id, [it.template, it.id])).map((it, idx) =>
                                    <FileFace
                                        key={ it.id }
                                        adjuster={ () =>
                                            <Input.Checkbox
                                                checked={ r.contains(it.id, selectedComponents) }
                                                onChange={ r.pipe(r.always(it.id), wire('selection.toggle')) }
                                                modifiers='l' />
                                        }
                                        { ...(FileFace.params(it)) }
                                        element={ it } />
                                ) }
                            </FileExplorer.Folder>
                        ) }
                    </FileExplorer>
                </div>
            </Modal>

            <div id='print'>
                { threadLast(pages)(
                    r.addIndex(r.map)(([size, pages], idx) => pages.map((page) =>
                        <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} width={ canvasWidth } height={ canvasHeight } key={ size + Math.random() } className='print__page'>
                            {page.map((it) => {
                                let left = it.x,
                                    lefter = Math.max(0, ...page.map((it) => it.x + it.width).filter((it) => it < left)),
                                    top = it.y,
                                    topper = Math.max(0, ...page.map((it) => it.y + it.height).filter((it) => it < top)),
                                    right = it.x + it.width,
                                    righter = Math.min(canvasWidth, ...page.map((it) => it.x).filter((it) => it > right)),
                                    bottom = it.y + it.height,
                                    bottomer = Math.min(canvasHeight, ...page.map((it) => it.y).filter((it) => it > bottom)),
                                    disabledGuides = {
                                        nw: [left, top],
                                        sw: [left, bottom],
                                        ne: [right, top],
                                        se: [right, bottom]
                                    }

                                return <g>
                                    {showCropMarks && [[left, top, lefter, top], [left, top, left, topper], [right, top, right, topper], [right, top, righter, top], [left, bottom, lefter, bottom], [left, bottom, left, bottomer], [right, bottom, righter, bottom], [right, bottom, right, bottomer]]
                                        .filter(([h, v]) =>
                                            !r.any(
                                                ([name, disabled]) => r.contains(name, it.disabledGuides) && r.equals(disabled, [h, v]),
                                                r.toPairs(disabledGuides)
                                            )
                                        )
                                        .map((it) =>
                                            <polyline
                                                key={ it.join(' ') }
                                                className='print__guide'
                                                points={ r.splitEvery(2, it).map((it) => it.join(',')).join(' ') } />
                                    ) }

                                    <ElementRenderer
                                        x={ it.x }
                                        y={ it.y }
                                        sides={ it.isBack ? 'back' : 'front' }
                                        key={ it.id }
                                        useExactSize
                                        showDocument={ showCutlines }
                                        element={ it }
                                        realTime
                                        style={{ width: it.width / DEFAULT_PPI + 'in', height: it.height / DEFAULT_PPI + 'in' }}
                                        viewBox={ `${ it.isBack ? -it.width - 20 : 0 } 0 ${ it.width } ${ it.height }`} />
                                </g>
                            })}
                        </svg>
                    ))
                ) }
            </div>
        </div>
    }
)
