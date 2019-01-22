let Story = require('./Story.js'),
    TabBar = require('components/common/TabBar.js')

module.exports = <Story name='TabBar'>
    <Story.Chapter name='TabBar'>
        <TabBar onClose={ Story.log } onSelect={ Story.log } selected={ 0 }>
            <TabBar.Tab label='Tab 1' closingDisabled>
                <h1>Tab #1</h1>
            </TabBar.Tab>

            <TabBar.Tab label='Tab 2'>
                <h1>Tab #2</h1>
            </TabBar.Tab>

            <TabBar.Tab label='Tab 3'>
                <h1>Tab #3</h1>
            </TabBar.Tab>

            <TabBar.Tab label='Tab 4'>
                <h1>Tab #4</h1>
            </TabBar.Tab>
        </TabBar>
    </Story.Chapter>
</Story>
