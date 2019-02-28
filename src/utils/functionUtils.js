module.exports = {
    memoizedFunction: (fn) => {
        let cache = {}

        return (...props) => {
            let hash = JSON.stringify(props),
                result = cache[hash]

            if (!result) {
                result = fn(...props)
                cache[hash] = result
            }

            return result
        }
    }
}
