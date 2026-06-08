global.chrome = {
    runtime: {
        onInstalled: {
            addListener: () => {}
        },
        onMessage: {
            addListener: () => {}
        }
    },
    contextMenus: {
        create: () => {},
        onClicked: {
            addListener: () => {}
        }
    },
    downloads: {
        download: () => {}
    }
} as any;
