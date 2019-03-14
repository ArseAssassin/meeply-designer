let { distanceInWordsToNow } = require('date-fns'),
    latestUpdates = require('constants/latestUpdates.js'),

    { DISCORD_URL } = require('constants/urls.js')

module.exports = () =>
    <div className='splash-screen'>
        <VGroup>
            { latestUpdates.map((it) =>
                <Type modifiers='multiline' key={ it.date }>
                    <date><Type modifiers='heading'>{ distanceInWordsToNow(new Date(it.date)) } ago</Type></date>
                    { it.body }
                </Type>
            ) }

            <VGroup modifiers='margin-s'>
                <Type modifiers='heading l align-center'>For latest beta features </Type>
                <Type modifiers='heading l align-center'><a target='_blank' rel='noopener noreferrer' href={ DISCORD_URL }>join our community at Discord</a></Type>
            </VGroup>
        </VGroup>
    </div>
