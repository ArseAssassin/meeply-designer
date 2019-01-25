let measureSVGText = (textContent, helperClass, style='') => {
    let lines = textContent.split('\n'),
        lineWords = lines.map((it) => it.split(' ')),
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
        text = document.createElementNS('http://www.w3.org/2000/svg', 'text')

    svg.appendChild(text)
    svg.setAttribute('class', helperClass)
    svg.setAttribute('style', style)
    document.body.appendChild(svg)

    let content = threadLast(lineWords)(
        r.map(r.map((it) => {
            text.textContent = it
            return {
                word: it,
                width: text.getComputedTextLength(),
                height: text.getBoundingClientRect().height
            }
        }))
    )

    document.body.removeChild(svg)

    return content
}

module.exports = {
    measureSVGText
}
