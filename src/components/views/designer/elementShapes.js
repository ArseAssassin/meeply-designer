let { rgbToHex } = require('utils/colorUtils.js')

module.exports = r.mapObjIndexed(
    (fn) => (it, className='element-view__canvas', isBack) => {
        let component = fn(it, isBack)

        return React.cloneElement(component, {
            ...component.props,
            className,
            style: {
                fill:
                    it.bgColor
                      ? rgbToHex(it.bgColor)
                      : '#ffffff'
            }
        })
    },

    {
        rect: ({ width, height }, isBack) =>
            <rect
                width={ width }
                height={ height }
                x={ isBack ? -width - 20 : 0 }
                y='0' />,

        roundedRect: ({ width, height }, isBack) =>
            <rect
                width={ width }
                height={ height }
                rx='5'
                ry='5'
                x={ isBack ? -width - 20 : 0 }
                y='0' />,

        ellipse: ({ width, height }, isBack) =>
            <ellipse
                rx={ width / 2 }
                ry={ height / 2 }
                cx={ isBack ? -width / 2 - 20 : width / 2 }
                cy={ height / 2}
                x='0'
                y='0' />,

        hexagon: ({ width, height }, isBack) => {
            let zero = isBack ? -width - 20 : 0

            return <polygon
                points={ `${zero},${height / 2} ${zero + width / 4},0 ${zero + width / 4 * 3},0 ${zero + width},${height / 2} ${zero + width / 4 * 3},${height} ${zero + width / 4},${height} ${zero},${height / 2}` }
                />
        }
    }
)
