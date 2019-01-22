require('./element-list.styl')
let { elements } = require('constants/elements.js')

module.exports = () =>
    <div className='element-list'>
        <VGroup modifiers='grow'>
            <HGroup modifiers='grow'>
                <button>Elements</button>
                <button>Templates</button>
            </HGroup>

            <VGroup data-group-modifiers='grow' modifiers='margin-xs'>
                { elements.map((it) =>
                    <a href='wtf'>
                        <HGroup modifiers='grow justify-space-between align-center'>
                            { it.name }
                            { it.count }
                        </HGroup>
                    </a>
                ) }
            </VGroup>

            <button>+</button>
        </VGroup>
    </div>
