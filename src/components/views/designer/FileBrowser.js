let Modal = require('components/common/Modal.js'),
    FileExplorer = require('components/common/FileExplorer.js'),

    resourcesModel = require('model/resourcesModel.js')

require('./file-browser.styl')


let makeDataUri = (body) => `data:image/svg+xml;utf8,${body}`

module.exports = switchboard.component(
    ({ signal, slot, propsProperty }) => ({
        isOpen: signal(
            false,

            slot('toggle'), r.not,

            propsProperty.map(r.path(words('value body'))).filter(r.not).take(1), r.T
        ),
        images: resourcesModel.images.signal.map(r.sortBy(r.prop('name'))),
        chosenImage: signal(
            0,

            slot('image.set')
        )
    }),
    ({ wiredState: { chosenImage, images, isOpen }, wire, value, onChange }) => {
        let save = r.pipe(r.tap(wire('toggle')), r.always(images[chosenImage]), onChange)

        return <VGroup modifiers='margin-s'>
            <div onClick={ wire('toggle') }>
                <VGroup modifiers='margin-s'>
                    <Type modifiers='s'>{ value.name }</Type>
                    <button>Browse...</button>
                </VGroup>
            </div>

            <Modal
                onClose={ wire('toggle') }
                isOpen={ isOpen }
                heading='Resources'>

                <VGroup>
                    <HGroup modifiers='grow align-center'>
                        <div className='file-browser__files'>
                            <FileExplorer
                                defaultValue={ chosenImage }
                                onChange={ wire('image.set') }
                                rootName='/'
                                modifiers='icon-xs'
                                preview={
                                    <div className='file-browser__preview' data-group-modifiers='align-center'>
                                        <VGroup>
                                            <img src={ images[chosenImage].body } />
                                            <Type modifiers='align-center'>{ images[chosenImage].name }</Type>
                                            <Type modifiers='align-center'>{ images[chosenImage].license }</Type>

                                            <button onClick={ save }>Save</button>
                                        </VGroup>
                                    </div>
                                }>
                                <FileExplorer.Folder name='Fractal Symbols'>
                                    { images.map((it) =>
                                        <FileExplorer.File name={ it.name } key={ it.name } onDoubleClick={ save }>
                                            <img src={ it.body } />
                                        </FileExplorer.File>
                                    ) }
                                </FileExplorer.Folder>
                            </FileExplorer>
                        </div>
                    </HGroup>
                </VGroup>
            </Modal>

        </VGroup>
    }
)

// slot('layers.image.add')
//             .flatMapLatest((event) => {
//                 let input = document.createElement('input')
//                 input.setAttribute('type', 'file')
//                 input.click()

//                 return (
//                     kefir.fromEvents(input, 'change').take(1)
//                     .flatMapLatest((e) => {
//                         let reader = new FileReader(),
//                             file = e.target.files[0]

//                         setTimeout(() => reader.readAsDataURL(file), 10)

//                         return (
//                             kefir.fromEvents(reader, 'load')
//                             .flatMapLatest(() => {
//                                 let img = document.createElement('img')
//                                 img.setAttribute('src', reader.result)

//                                 return kefir.fromEvents(img, 'load').map(r.always(img))
//                             })
//                             .map((it) => ({
//                                 width: it.width,
//                                 height: it.height,
//                                 body: {
//                                     name: file.name,
//                                     body: reader.result
//                                 }
//                             }))
//                         )
//                     })
//                     .map((body) => {
//                         return ({
//                             ...body,
//                             type: 'image',
//                             name: 'Image',
//                             x: 0,
//                             y: 0,
//                             id: uuid()
//                         })
//                     })
//                 )
//             })
