export const hub = {
    id: "MENU_HUB",
    icon: "DashboardIcon",
    text: "Thủ kho",
    child: [
        {
            id: "MENU_SCR_SMDELI_HUB",
            path: "/hubmanager/hublist",
            text: "Danh sách kho",
            child: [],
        },
        {
            id: "MENU_SCR_SMDELI_HUB",
            path: "/hubmanager/createhub",
            icon: "StarBorder",
            text: "Thêm kho",
            child: [],
        },
        // {
        //     id: "MENU_WMSv2_ADMIN.ORDER",
        //     path: "/hubmanager/updatehub",
        //     isPublic: true,
        //     icon: "StarBorder",
        //     text: "Danh sách đơn xuất hàng",
        //     child: [],
        // },

    ]
};
