let uuid = require('uuid/v4'),
    { required } = require('valivali'),
    Input = require('components/common/Input.js'),
    FormField = require('components/forms/FormField.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    componentForm = require('wireState/componentForm.js'),
    elementShapes = require('components/views/designer/elementShapes.js'),

    templates = require('constants/templates.js')


require('./new-element.styl')

const
    MAX_WIDTH = Math.max.apply(Math, templates.map(r.path(words('body width')))),
    MAX_HEIGHT = Math.max.apply(Math, templates.map(r.path(words('body height'))))

module.exports = switchboard.component(
    componentForm({
        name: {
            defaultValue: 'New component',
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
                name: formValue.name,
                ...templates[formValue.template].body,
                id: uuid(),
                count: 1,
                showBack: false,
                body: [] }),
            onSubmit
        ) }>
            <VGroup>
                <Type modifiers='heading'>Create new component set</Type>

                <HGroup modifiers='align-end'>
                    {capture(<FormField name='name'>
                        <Input.Text label='Name' />
                    </FormField>)}
                    <button>Create</button>
                </HGroup>

                <VGroup modifiers='margin-s'>
                    <Type modifiers='label'>Template</Type>
                    { capture(<FormField.Basic name='template'>
                        <FileExplorer hideBreadcrumbs defaultValue={ formValue.template } mustSelect>
                            { templates.map((it, idx) =>
                                <FileExplorer.File key={ it.name } name={ it.name } value={ idx }>
                                    <svg
                                        width='100%'
                                        height='100%'
                                        viewBox={ `${ - MAX_WIDTH / 2 + it.body.width / 2 - 20 } ${ - MAX_HEIGHT / 2 + it.body.height / 2 - 20 } ${ MAX_WIDTH + 40 } ${ MAX_HEIGHT + 40 }`}
                                        className='new-element__template-face'>
                                        { elementShapes[it.body.shape](it.body) }
                                    </svg>
                                </FileExplorer.File>
                            ) }
                        </FileExplorer>
                    </FormField.Basic>)}

                </VGroup>
            </VGroup>
        </form>
)
