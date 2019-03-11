let Button = require('components/common/Button.js')

require('./splash-screen.styl')

module.exports = ({ onClose }) => <VGroup>
    <div className='splash-screen'>
        <VGroup>
            <img alt='Meeply Designer' className='splash-screen__logo' src={ require('../../../assets/logo.png') } />

            <Type modifiers='align-center heading l'>With Meeply Designer you can</Type>

            <Type modifiers='l multiline'>
                <ul>
                    <li>Quickly design cards, tiles, hexagons for your board game</li>
                    <li>Easily adjust component counts and distributions</li>
                    <li>...and print everything straight from your browser</li>
                </ul>
            </Type>

            { window.innerWidth < 800 || window.innerHeight < 450 || 'ontouchstart' in window
              ? <VGroup>
                    <Type modifiers='multiline'>Meeply Designer works best on desktop browsers such as Chrome or Firefox. Touch devices might not work as expected.</Type>

                    <HGroup modifiers='justify-center grow'>
                        <Button modifiers='blue' onClick={ onClose }>Take me to the app anyway</Button>
                    </HGroup>
                </VGroup>
              : <HGroup modifiers='justify-center grow'>
                    <Button modifiers='blue' onClick={ onClose }>Take me to the app</Button>
                </HGroup>
            }
        </VGroup>
    </div>
</VGroup>
