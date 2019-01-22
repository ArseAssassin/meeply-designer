let uuid = require('uuid/v4'),
    { required } = require('valivali'),
    Input = require('components/common/Input.js'),
    FormField = require('components/forms/FormField.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    componentForm = require('wireState/componentForm.js'),

    gameModel = require('model/gameModel.js'),

    { DEFAULT_PPI } = require('constants/units.js')

module.exports = switchboard.component(
    componentForm({
        name: {
            defaultValue: 'New deck',
            validator: required()
        },
        template: {
            defaultValue: 0
        }
    }),
    ({ wiredState: { capture, formValue }, wire, onSubmit }) =>
        <form onSubmit={ (it) => threadLast(it)(
            cancel,
            r.always({
                ...formValue,
                width: 8.3 * DEFAULT_PPI,
                height: 11.7 * DEFAULT_PPI,
                id: uuid(),
                count: 1,
                body: [] }),
            onSubmit
        ) }>
            <VGroup>
                <Type modifiers='heading'>Create new deck</Type>

                <HGroup modifiers='align-end'>
                    {capture(<FormField name='name'>
                        <Input.Text label='Name' />
                    </FormField>)}
                    <button>Create</button>
                </HGroup>

                <VGroup modifiers='margin-s'>
                    <Type modifiers='label'>Template</Type>
                    { capture(<FormField.Basic name='template'>
                        <FileExplorer rootName='/' defaultValue={ formValue.template } mustSelect>
                            <FileExplorer.File name='Card'>
                            </FileExplorer.File>

                            <FileExplorer.File name='Chit'>
                            </FileExplorer.File>

                            <FileExplorer.File name='Tile'>
                            </FileExplorer.File>

                            <FileExplorer.File name='Map'>
                            </FileExplorer.File>

                            <FileExplorer.File name='Blank sheet'>
                            </FileExplorer.File>
                        </FileExplorer>
                    </FormField.Basic>)}

                </VGroup>
            </VGroup>
        </form>
)
