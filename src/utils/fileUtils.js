let fileSaver = require('file-saver')

module.exports = {
    saveJSON: (name, body) => {
        let blob = new Blob([JSON.stringify(body)], { type: 'application/json;charset=utf-8' })

        fileSaver.saveAs(blob, name)
    },
    saveBlob: (name, blob) => {
        fileSaver.saveAs(blob, name)
    },
    load: (accept) => {
        let input = document.createElement('input')

        input.setAttribute('type', 'file')
        input.setAttribute('accept', accept)
        input.click()

        return (
            kefir.fromEvents(input, 'change').take(1)
            .flatMapLatest((e) => {
                let reader = new FileReader(),
                    file = e.target.files[0]

                setTimeout(() => reader.readAsDataURL(file), 10)

                return (
                    kefir.fromEvents(reader, 'load')
                    .map(() => ({ body: reader.result, name: file.name }))
                )
            })
        )
    }
}
