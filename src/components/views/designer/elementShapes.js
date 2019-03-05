module.exports = r.mapObjIndexed(
    (fn) => (it, className='element-view__canvas') => {
        let component = fn(it)

        return React.cloneElement(component, { ...component.props, className })
    },

    {
        rect: ({ width, height }) =>
            <rect
                width={ width }
                height={ height }
                x='0'
                y='0' />,

        roundedRect: ({ width, height }) =>
            <rect
                width={ width }
                height={ height }
                rx='5'
                ry='5'
                x='0'
                y='0' />,

        ellipse: ({ width, height }) =>
            <ellipse
                rx={ width / 2 }
                ry={ height / 2 }
                cx={ width / 2 }
                cy={ height / 2}
                x='0'
                y='0' />,

        hexagon: ({ width, height }) =>
            <polygon
                points={ `0,${height / 2} ${width / 4},0 ${width / 4 * 3},0 ${width},${height / 2}, ${width / 4 * 3},${height} ${width / 4},${height} 0,${height / 2}` }
                />,
    }
)
