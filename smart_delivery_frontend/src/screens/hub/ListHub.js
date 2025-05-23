import React, { useEffect, useState } from "react";
import { request } from "api";
import StandardTable from "../../components/StandardTable";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MapIcon from "@mui/icons-material/Map";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Modal, Box, Typography, Button } from '@mui/material';
import Maps from 'components/map/map';
import { useSelector } from "react-redux";

function ListHub() {
    const [hubs, setHubs] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedHub, setSelectedHub] = useState(null);
    const role = useSelector((state) => state.auth.user?.role);

    // Check if user is admin
    const isAdmin = role === "ADMIN";

    useEffect(() => {
        request("get", "/smdeli/hubmanager/hub", (res) => {
            setHubs(res.data);
        }).then();
    }, []);

    // Define columns based on user role
    const getColumns = () => {
        const baseColumns = [
            {
                title: "Mã hub",
                field: "id",
            },
            {
                title: "Tên Hub",
                field: "name",
            },
            {
                title: "Vị trí",
                field: "address",
            },
            {
                title: "Xem vị trí",
                sorting: false,
                renderCell: (rowData) => (
                    <IconButton
                        onClick={() => {
                            handleShowLocation(rowData);
                        }}
                        variant="contained"
                        color="primary"
                    >
                        <MapIcon />
                    </IconButton>
                ),
            }
        ];

        // If user is HUB_MANAGER, only add View action
        if (role === "HUB_MANAGER") {
            baseColumns.push({
                title: "Thao tác",
                field: "actions",
                centerHeader: true,
                sorting: false,
                renderCell: (rowData) => (
                    <div style={{ display: 'flex', gap: '5px', padding: '0px'}}>
                        <IconButton
                            style={{ padding: '5px' }}
                            onClick={() => handleView(rowData)}
                            color="primary"
                        >
                            <VisibilityIcon />
                        </IconButton>
                    </div>
                ),
            });
        }
        // If user is ADMIN, add all actions (View, Edit, Delete)
        else if (isAdmin) {
            baseColumns.push({
                title: "Thao tác",
                field: "actions",
                centerHeader: true,
                sorting: false,
                renderCell: (rowData) => (
                    <div style={{ display: 'flex', gap: '5px', padding: '0px'}}>
                        <IconButton
                            style={{ padding: '5px' }}
                            onClick={() => handleView(rowData)}
                            color="primary"
                        >
                            <VisibilityIcon />
                        </IconButton>
                        <IconButton
                            style={{ padding: '5px' }}
                            onClick={() => handleEdit(rowData)}
                            color="success"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            style={{ padding: '5px' }}
                            onClick={() => handleDelete(rowData)}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </div>
                ),
            });
        }

        return baseColumns;
    };

    const handleShowLocation = (hub) => {
        setSelectedHub(hub);
        setOpenModal(true);
    };

    const handleView = (hub) => {
        // Add view functionality - navigate to view page or show details in modal
        window.location.href = `/hubmanager/hub/view/${hub.id}`;
    };

    const handleEdit = (hub) => {
        // Only allow admins to edit
        if (isAdmin) {
            window.location.href = `/hubmanager/hub/update/${hub.id}`;
        }
    };

    const handleDelete = (hub) => {
        // Only allow admins to delete
        if (isAdmin) {
            const isConfirmed = window.confirm(`Bạn có chắc muốn xóa Hub: ${hub.name} - Địa chỉ: ${hub.address}?`);
            if (isConfirmed) {
                const data = { id: hub.id };
                request(
                    "delete",
                    `/smdeli/hubmanager/hub/delete`,
                    (res) => {
                        if (res.status === 200) {
                            alert("Xóa hub thành công");
                            setHubs(hubs.filter(h => h.id !== hub.id));
                        }
                    },
                    {},
                    data
                );
            }
        }
    };

    // Get AddHub button based on role
    const renderAddButton = () => {
        if (isAdmin) {
            return (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.location.href = '/hubmanager/hub/add'}
                    style={{ marginBottom: '20px' }}
                >
                    Add Hub
                </Button>
            );
        }
        return null;
    };

    return (
        <div>
            {renderAddButton()}

            <StandardTable
                title="Hub List"
                columns={getColumns()}
                data={hubs}
                options={{
                    selection: false,
                    pageSize: 20,
                    search: true,
                    sorting: true,
                }}
            />

            {/* Modal để hiển thị bản đồ */}
            <Modal
                open={openModal}
                onClose={() => setOpenModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '60%',
                    height: '80%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Box sx={{ height: "10%" }}>
                        <Typography variant="h6" id="modal-modal-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            Vị trí của Hub: {selectedHub?.name}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setOpenModal(false)}
                                style={{marginBottom: '1%' }}
                            >
                                Đóng
                            </Button>
                        </Typography>
                    </Box>
                    <Box sx={{ height: "90%" }}>
                        <Maps selectPosition={{ lat: selectedHub?.latitude, lon: selectedHub?.longitude }} />
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default ListHub;