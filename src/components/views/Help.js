let { DISCORD_URL } = require('constants/urls.js')

module.exports = () => <div className='splash-screen'>
    <VGroup modifiers='margin-s'>
        <Type modifiers='multiline'>
            <blockquote>
                How do I get started?
            </blockquote>
            <p>Double click on "New component set" to start creating your first deck.</p>

            <blockquote>
                How can I print multiple copies of a component?
            </blockquote>
            <p>When previewing a component, a number is shown below it indicating how many copies of the component are in the deck. You can click on the number and type in the count you want.</p>

            <blockquote>
                How do I replace an image in a subcomponent?
            </blockquote>
            <p>Select the image you want to replace in the subcomponent, and click on "Replace" in the layer properties.</p>
        </Type>

        <Type modifiers='align-center'>
            For more help and instructions
        </Type>

        <Type modifiers='heading align-center l'>
            join our <a target='_blank' href={ DISCORD_URL }>Discord Community</a>
        </Type>
    </VGroup>
</div>
