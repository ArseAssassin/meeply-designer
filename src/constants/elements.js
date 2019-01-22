module.exports = {
    elements: [
        {
            "name": "Card 1",
            "count": 1,
            "body": [
                {
                    "type": "image",
                    "body": "",
                    "x": 0,
                    "y": 0,
                    "id": "Image 1"
                },
                {
                    "type": "text",
                    "body": "Hello world",
                    "x": 10,
                    "y": 10,
                    "style": {
                        "font-family": "Arial",
                        "font-size": 10,
                        "fill": "red"
                    },
                    "id": "Text 1"
                }
            ],
            "template": null
        },
        {
            "name": "Card 2",
            "count": 5,
            "template": "Template 1",
            "body": [
                {
                    "id": "Image 1",
                    "body": "data:image/png;base64,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"
                },
                {
                    "id": "Text 1",
                    "body": "This is a card based on a template"
                }
            ]
        }
    ],
    templates: [
        {
            "name": "Template 1",
            "id": "Template 1",
            "body": [
                {
                    "type": "image",
                    "body": "",
                    "x": 0,
                    "y": 0,
                    "id": "Image 1"
                },
                {
                    "type": "text",
                    "body": "",
                    "x": 10,
                    "y": 10,
                    "style": {
                        "font-family": "Arial",
                        "font-size": 10,
                        "fill": "red"
                    },
                    "id": "Text 1"
                }
            ]
        }
    ]
}
