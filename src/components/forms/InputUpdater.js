let { findDOMNode } = require('react-dom'),
    createClass = require('create-react-class')

let sanitizeProps = r.pipe(
    r.omit(words('value onChange')),
    (it) => ({
        ...it,
        children: React.Children.toArray(it.children).map((it) => sanitizeProps(it.props))
    })
)

module.exports = createClass({
    displayName: 'InputUpdater',

    shouldComponentUpdate(nextProps) {
        if (!r.equals(nextProps, { ...this.props, value: this.value })) {
            if (!this.target) {
                let ref = findDOMNode(this)

                this.target = ref.querySelector('input') || ref.querySelector('textarea')
            }

            if (this.target) {
                this.target.value = nextProps.value === undefined
                    ? ''
                    : nextProps.value
            }

            return !r.equals(sanitizeProps(nextProps), sanitizeProps(this.props))
        } else {
            return false
        }
    },

    onChange(e) {
        let { target: { value } } = e

        this.target = e.target
        this.value = this.reduce(value)

        if (this.value !== this.target.value) {
            this.target.value = this.value
        }

        this.props.onChange(r.assocPath(words('target value'), this.value, e))
    },

    reduce(value) {
        return (this.props.reducer || r.identity)(value)
    },

    setRef(it) {
        this.ref = it
    },

    render() {
        return React.Children.toArray(this.props.children).map((it) =>
            React.cloneElement(it, {
                ...r.omit(['children', 'name'], this.props),
                ...it.props,
                reducer: undefined,
                value: undefined,
                defaultValue: this.props.value,
                onChange: this.onChange
            })
        )
    }
})
