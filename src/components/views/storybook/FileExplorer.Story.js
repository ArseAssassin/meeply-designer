let Story = require('./Story.js'),
    FileExplorer = require('components/common/FileExplorer.js')

module.exports = <Story name='FileExplorer'>
    <Story.Chapter name='FileExplorer'>
        <FileExplorer rootName='File explorer #1'>
            <FileExplorer.Folder name='Folder 1'>
               <FileExplorer.Folder name='Subfolder 1'>
                    { r.range(0, 2).map((it) =>
                        <FileExplorer.File name={ `Sub-sub-file #${ it }` } onDoubleClick={ () => Story.log(it) }>
                            <div style={{ textAlign: 'center' }}>{ it }</div>
                        </FileExplorer.File>
                    ) }
               </FileExplorer.Folder>

                { r.range(0, 4).map((it) =>
                    <FileExplorer.File name={ `Sub-file #${ it }` } onDoubleClick={ () => Story.log(it) }>
                        <div style={{ textAlign: 'center' }}>{ it }</div>
                    </FileExplorer.File>
                )}
            </FileExplorer.Folder>

            { r.range(0, 12).map((it) =>
                <FileExplorer.File name={ `File #${ it }` } onDoubleClick={ () => Story.log(it) }>
                    <div style={{ textAlign: 'center' }}>{ it }</div>
                </FileExplorer.File>
            )}
        </FileExplorer>
    </Story.Chapter>

    <Story.Chapter name='FileExplorer as a form component'>
        <FileExplorer rootName='File explorer' defaultValue={ 0 } mustSelect hideBreadcrumbs onChange={ Story.log }>
            { r.range(0, 4).map((it) =>
                <FileExplorer.File name={ `File #${ it }` }>
                    <div style={{ textAlign: 'center' }}>{ it }</div>
                </FileExplorer.File>
            )}
        </FileExplorer>
    </Story.Chapter>
</Story>
