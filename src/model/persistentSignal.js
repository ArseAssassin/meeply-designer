module.exports = (signal) => (name, initialValue, ...rest) => {
    if (typeof localStorage !== 'undefined') {
        return signal(
            localStorage.getItem(name)
                ? JSON.parse(localStorage.getItem(name))
                : initialValue,

            ...rest
        ).onValue((it) => localStorage.setItem(name, JSON.stringify(it)))
    } else {
        return signal(initialValue, ...rest)
    }


}
