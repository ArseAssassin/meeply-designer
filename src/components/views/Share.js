let { DISCORD_URL } = require('constants/urls.js')

module.exports = () =>
    <VGroup>
        <Type modifiers='multiline'>
            <ol>
                <li>Click on <Icon name='print' modifiers='inline s' /> in the toolbar to open the print dialog</li>
                <li>Select <b>Print game</b></li>
                <li>In the print dialog, select <b>Save as PDF</b> to generate a PDF file</li>
                <li>Select <b>Print</b> - a PDF file will be saved on your computer</li>
                <li>Send the PDF file to your friends and show it off in our <b><a target='_blank' rel='noopener noreferrer' href={ DISCORD_URL }>Discord Community</a></b></li>
            </ol>
        </Type>
    </VGroup>
