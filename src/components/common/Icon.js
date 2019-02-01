require('./icon.styl')

let icons = {
    create: require('./../../../node_modules/feather-icons/dist/icons/plus-circle.svg'),
    x: require('./../../../node_modules/feather-icons/dist/icons/x.svg'),
    folder: require('./../../../node_modules/feather-icons/dist/icons/folder.svg'),
    image: require('./../../../node_modules/feather-icons/dist/icons/image.svg'),
    hash: require('./../../../node_modules/feather-icons/dist/icons/hash.svg'),
    cursor: require('./../../../node_modules/feather-icons/dist/icons/arrow-up-left.svg'),
    type: require('./../../../node_modules/feather-icons/dist/icons/type.svg'),
    file: require('./../../../node_modules/feather-icons/dist/icons/file.svg'),
    plus: require('./../../../node_modules/feather-icons/dist/icons/plus.svg'),
    link: require('./../../../node_modules/feather-icons/dist/icons/link.svg'),
    trash: require('./../../../node_modules/feather-icons/dist/icons/trash-2.svg'),
    'align-left': require('./../../../node_modules/feather-icons/dist/icons/align-left.svg'),
    'align-center': require('./../../../node_modules/feather-icons/dist/icons/align-center.svg'),
    'align-right': require('./../../../node_modules/feather-icons/dist/icons/align-right.svg'),
    reset: require('./../../../node_modules/feather-icons/dist/icons/rotate-ccw.svg'),
    count: require('./../../../node_modules/feather-icons/dist/icons/layers.svg'),
    print: require('./../../../node_modules/feather-icons/dist/icons/printer.svg'),
    document: require('./../../../node_modules/feather-icons/dist/icons/file.svg'),
    save: require('./../../../node_modules/feather-icons/dist/icons/save.svg'),
    test: require('./../../../node_modules/feather-icons/dist/icons/play-circle.svg'),
    info: require('./../../../node_modules/feather-icons/dist/icons/info.svg'),
    upload: require('./../../../node_modules/feather-icons/dist/icons/upload-cloud.svg'),
    rename: require('./../../../node_modules/feather-icons/dist/icons/edit-3.svg'),
    zoom: require('./../../../node_modules/feather-icons/dist/icons/search.svg')
}

module.exports = ({ name, modifiers='' }) =>
    <div className={ modifiersToClass('icon', modifiers) } dangerouslySetInnerHTML={{ __html: icons[name] }} />
