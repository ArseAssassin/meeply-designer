module.exports = switchboard.model(({ slot }) => ({
    log: {
        signal:
            slot('log.append')
            .map((it) => {
                try {
                    let s = JSON.stringify(it)

                    return s
                } catch (e) {
                    return `ERROR: ${e.toString()}`
                }
            }).scan(r.flip(r.append), []),
        append: slot('log.append')
    }
}))
