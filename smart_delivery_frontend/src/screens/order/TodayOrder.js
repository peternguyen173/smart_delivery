import LoadingScreen from "components/common/loading/loading";
import {Box, Button, Grid, Modal, Tab, Typography} from "@mui/material";
import {request} from "api";
import StandardTable from "components/StandardTable";
import React, {Fragment, useEffect, useState, useCallback} from "react";
import useStyles from "screens/styles";
import {errorNoti, processingNoti, successNoti} from "utils/notification";
import {useHistory, useLocation} from "react-router";
import {useParams, useRouteMatch} from "react-router-dom";
import {TabContext, TabList, TabPanel} from "@mui/lab";
import {useSelector} from "react-redux";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Maps from "../../components/map/map";
import SearchBox from "../../components/map/searchBox";
import {EnhancedMap} from "../../components/map/EnhancedMap";
import {API_PATH} from "../apiPaths";

const TodayOrder = (props) => {
    const history = useHistory();
    const {id: pathId} = useParams(); // Lấy ID từ path
    const location = useLocation();

    // Determine target type from path
    const getTargetTypeFromPath = () => {
        if (location.pathname.includes('/collector/')) {
            return 'collector';
        } else if (location.pathname.includes('/shipper/')) {
            return 'shipper';
        }
        return null;
    };

    const targetType = getTargetTypeFromPath();
    const {path} = useRouteMatch();
    const username = useSelector((state) => state.auth.user?.username);
    const role = useSelector((state) => state.auth.user?.role);
    const classes = useStyles();
    const [selectPosition, setSelectPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const hubId = useSelector((state) => state.auth.user?.hubId);
    const [hub, setHub] = useState();
    const [nextOrder, setNextOrder] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [assignmentData, setAssignmentData] = useState([]);
    const [tabValue, setTabValue] = useState('1');
    const [expandedRows, setExpandedRows] = useState({});

    console.log("role",role)
    // Determine if user is collector or shipper
    const isCollector = role === 'COLLECTOR';
    const isShipper = role === 'SHIPPER';
    const isHubManager = role === 'HUB_MANAGER'; // Thêm dòng này

    // Session storage keys based on role
    const assignmentsStorageKey = isCollector ? 'collector_assignments' : 'shipper_assignments';
    const nextOrderStorageKey = isCollector ? 'collector_nextOrder' : 'shipper_nextOrder';
    const savedNextOrderKey = isCollector ? 'collector_savedNextOrder' : 'shipper_savedNextOrder';

    // Role-specific strings
    const roleText = (isCollector  || targetType === "collector")? 'thu gom' : 'giao hàng';
    const personTypeText = isCollector ? 'người gửi' : 'người nhận';
    const actionProcessText = isCollector ? 'thu gom' : 'giao';
    const packageActionText = isCollector ? 'đã thu gom' : 'đã giao';

    // Role-specific API endpoints
    const userEndpoint = isCollector
        ? `/user/get-collector/${username}`
        : `/user/get-shipper/${username}`;

    const assignmentsEndpoint = useCallback((id) => {
        if (isHubManager) {
            // HUB_MANAGER xem assignments dựa trên type trong path
            if (targetType === 'collector') {
                return `/smdeli/assignment/collector/order/assign/today/collector/${id}`;
            } else if (targetType === 'shipper') {
                return `/smdeli/ordermanager/order/assign/shipper/today/${id}`;
            }
        }
        return isCollector
            ? `/smdeli/assignment/collector/order/assign/today/collector/${id}`
            : `/smdeli/ordermanager/order/assign/shipper/today/${id}`;
    }, [isCollector]);

    // Role-specific navigation paths
    const detailPath = isCollector ? '/order/collector/' : '/order/shipper/';

    // Helper function to check if assignment is completed based on role
    const isAssignmentCompleted = (assignment) => {
        if (isCollector) {
            return assignment.assignmentStatus === "COMPLETED" || assignment.assignmentStatus === "FAILED_ONCE";
        } else {
            return assignment.assignmentStatus === "COMPLETED" || assignment.assignmentStatus === "SHIPPED_FAILED";
        }
    };

    // Helper function to check if assignment can be operated on
    const canOperateOnAssignment = (assignment) => {
        return !isAssignmentCompleted(assignment);
    };

    // Filter assignments for map display (exclude completed ones)
    const getActiveAssignments = () => {
        return assignmentData.filter(assignment => !isAssignmentCompleted(assignment));
    };

    useEffect(() => {
        async function fetchId() {
            if (isHubManager) {
                console.log("HUB_MANAGER - ID from path:", pathId);
                setEmployeeId(pathId);
                return;
            }
            await request(
                "get",
                userEndpoint,
                (res) => {
                    console.log(res.data.id);
                    setEmployeeId(res.data.id);
                    console.log("hubId", res.data.hubId);
                }
            );
        }
        fetchId();
    }, [userEndpoint]);

    useEffect(() => {
        const fetchHubLocation = async () => {
            if (!hubId) return;

            await request(
                "get",
                `${API_PATH.HUB}/${hubId}`,
                (res) => {
                    setHub(res.data);
                },
                {
                    401: () => { },
                    503: () => { errorNoti("Có lỗi khi tải dữ liệu của kho") }
                }
            );
        }
        fetchHubLocation();
    }, [hubId]);

    const handleGoToDetails = () => {
        const nextOrderFromStorage = sessionStorage.getItem(nextOrderStorageKey);
        if (nextOrderFromStorage) {
            const nextOrder = JSON.parse(nextOrderFromStorage);
            history.push({
                pathname: `${detailPath}${nextOrder.orderId}`,
                state: { assignmentId: nextOrder.id }
            });
        } else {
            errorNoti(`Không tìm thấy đơn hàng ${roleText} tiếp theo`);
        }
    };

    const handleNextOrder = (order) => {
        setNextOrder(order);
    };

    // Role-specific order information component
    const NextOrderInfo = () => {
        const nextOrderData = JSON.parse(sessionStorage.getItem(nextOrderStorageKey));

        const nameField = isCollector ? 'senderName' : 'recipientName';
        const addressField = isCollector ? 'senderAddress' : 'recipientAddress';
        const phoneField = isCollector ? 'senderPhone' : 'recipientPhone';

        // Check if next order can be operated on
        const canOperate = nextOrderData ? canOperateOnAssignment(nextOrderData) : false;

        // Check if there are any active assignments left
        const activeAssignments = getActiveAssignments();
        const hasActiveAssignments = activeAssignments.length > 0;

        return (
            <Box sx={{paddingTop: 1.25, paddingLeft:2, paddingBottom: 1.25, paddingRight: 2, backgroundColor: '#f5f5f5', borderRadius: 2, marginBottom: 0.8}}>
                <Box sx={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginRight: 2, minWidth: '110px', paddingTop: '4px', color: 'primary.main' }}>
                        Đơn tiếp theo:
                    </Typography>

                    <Box sx={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Box>
                            {!hasActiveAssignments ? (
                                <Typography sx={{ color: 'green', fontWeight: 'bold' }}>
                                    Không còn đơn hàng cần {actionProcessText}!
                                </Typography>
                            ) : nextOrderData != null ? (
                                <>
                                    <Typography>Tên {personTypeText}: {nextOrderData?.[nameField]}</Typography>
                                    <Typography>Địa chỉ: {nextOrderData?.[addressField]}</Typography>
                                </>
                            ) : (
                                <Typography>Không có đơn hàng!</Typography>
                            )}
                        </Box>
                        {hasActiveAssignments && nextOrderData != null && <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography>Số điện thoại: {nextOrderData?.[phoneField]}</Typography>
                                <Typography>Số lượng package: {nextOrderData?.numOfItem}</Typography>
                                {!canOperate && (
                                    <Typography sx={{ color: 'orange', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                        (Đơn hàng đã hoàn thành - chỉ có thể xem)
                                    </Typography>
                                )}
                            </Box>
                            <Button
                                variant="contained"
                                color={canOperate ? "primary" : "secondary"}
                                onClick={handleGoToDetails}
                            >
                                {canOperate ? "Thao tác" : "Xem đơn hàng"}
                            </Button>
                        </Box>}
                    </Box>
                </Box>
            </Box>
        );
    };

    useEffect(() => {
        const nextOrderFromStorage = sessionStorage.getItem(nextOrderStorageKey);
        if (nextOrderFromStorage) {
            setNextOrder(JSON.parse(nextOrderFromStorage));
        }
    }, [nextOrderStorageKey]);

    useEffect(() => {
        if (!employeeId) {
            setLoading(false);  // Still stop loading even if employeeId is not available
            return;
        }
        async function fetchData() {
            await request(
                "get",
                assignmentsEndpoint(employeeId),
                (res) => {
                    if (res.data) {
                        const sortedData = res.data.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
                        setAssignmentData(sortedData);
                        sessionStorage.setItem(assignmentsStorageKey, JSON.stringify(sortedData));

                        // Find first active (non-completed) assignment for next order
                        const activeAssignments = sortedData.filter(assignment => !isAssignmentCompleted(assignment));

                        if (activeAssignments.length > 0 && !sessionStorage.getItem(savedNextOrderKey)) {
                            sessionStorage.setItem(nextOrderStorageKey, JSON.stringify(activeAssignments[0]));
                            sessionStorage.setItem(savedNextOrderKey, "1");
                            setNextOrder(activeAssignments[0]);
                        }
                    }
                }
            );
        }

        const assignmentsFromStorage = sessionStorage.getItem(assignmentsStorageKey);
        if (assignmentsFromStorage) {
            const parsedAssignments = JSON.parse(assignmentsFromStorage);
            const sortedAssignments = parsedAssignments?.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
            setAssignmentData(sortedAssignments);

            // Find first active assignment if no next order is set
            if (sortedAssignments?.length > 0 && !sessionStorage.getItem(nextOrderStorageKey)) {
                const activeAssignments = sortedAssignments.filter(assignment => !isAssignmentCompleted(assignment));
                if (activeAssignments.length > 0) {
                    sessionStorage.setItem(nextOrderStorageKey, JSON.stringify(activeAssignments[0]));
                }
            }
        }

        fetchData();
        setLoading(false);
    }, [employeeId, assignmentsEndpoint, assignmentsStorageKey, nextOrderStorageKey, savedNextOrderKey]);

    // Get role-specific coordinates for routes (only for active assignments)
    const routingPoints = (() => {
        const activeAssignments = getActiveAssignments();
        const points = activeAssignments?.map(order => {
            if (isCollector) {
                return {
                    lat: order.senderLatitude,
                    lng: order.senderLongitude
                };
            } else {
                return {
                    lat: order.recipientLatitude,
                    lng: order.recipientLongitude
                };
            }
        }).filter(point => point.lat && point.lng) || [];

        // If no active assignments, return hub location as the only point
        if (points.length === 0 && hub) {
            return [{
                lat: hub.latitude,
                lng: hub.longitude
            }];
        }

        return points;
    })();

    const handleShowRoute = () => {
        setOpenModal(true);
    };

    // Role-specific table columns
    const getTableColumns = () => {
        const commonColumns = [
            {title: "STT", field: "sequenceNumber"},
            {
                title: "Mã đơn hàng",
                field: "orderId",
                renderCell: (rowData) => {
                    const isExpanded = expandedRows[rowData.orderId] || false;

                    return (
                        <Typography
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row selection
                                setExpandedRows({
                                    ...expandedRows,
                                    [rowData.orderId]: !isExpanded
                                });
                            }}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                                maxWidth: isExpanded ? 'none' : '100px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: isExpanded ? 'normal' : 'nowrap'
                            }}
                        >
                            {rowData.orderId}
                        </Typography>
                    );
                }
            },
            {
                title: "Trạng thái",
                field: "assignmentStatus",
                renderCell: (rowData) => {
                    const completed = isAssignmentCompleted(rowData);
                    return (
                            rowData.assignmentStatus
                    );
                }
            },
            {
                title: "Thao tác",
                field: "actions",
                centerHeader: true,
                sorting: false,
                renderCell: (rowData) => {
                    return (
                        <div>
                            <IconButton
                                onClick={() => {
                                    history.push({
                                        pathname: `${detailPath}${rowData.orderId}`,
                                        state: { assignmentId: rowData.id }
                                    });
                                }}
                                color="info"
                                title="Xem đơn hàng"
                            >
                                <VisibilityIcon/>
                            </IconButton>
                        </div>
                    );
                }
            }
        ];

        if (isCollector || targetType == "collector") {
            return [
                ...commonColumns.slice(0, 2),
                {title: "Tên người gửi", field: "senderName"},
                {title: "Địa chỉ", field: "senderAddress"},
                {title: "Số điện thoại", field: "senderPhone"},
                ...commonColumns.slice(2)
            ];
        } else {
            return [
                ...commonColumns.slice(0, 2),
                {title: "Tên người nhận", field: "recipientName"},
                {title: "Địa chỉ", field: "recipientAddress"},
                {title: "Số điện thoại", field: "recipientPhone"},
                ...commonColumns.slice(2)
            ];
        }
    };

    return loading ? (
        <LoadingScreen/>
    ) : (
        <Fragment>
            <Box className={classes.bodyBox}>
                <TabContext value={tabValue}>
                    <Box sx={{borderBottom: 0, borderColor: "divider"}}>
                        <TabList
                            onChange={(event, newValue) => setTabValue(newValue)}
                        >
                            <Tab label="Danh sách đơn hàng" value="1"/>
                            {/* Chỉ hiển thị tab Bản đồ và Tiến trình nếu KHÔNG phải HUB_MANAGER */}
                            {!isHubManager && <Tab label="Bản đồ" value="2"/>}
                            {!isHubManager && <Tab label="Tiến trình" value="3"/>}

                        </TabList>
                    </Box>

                    <TabPanel value="1">
                        <StandardTable
                            title={`Bảng phân công ${isHubManager ? `${roleText} hôm nay - Mã nhân viên: ${pathId}` : `${roleText} hôm nay`}`}
                            columns={getTableColumns()}
                            data={assignmentData}
                            options={{
                                selection: false,
                                pageSize: 10,
                                search: true,
                                sorting: true,
                            }}
                            defaultOrderBy="sequenceNumber"
                        />
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
                                width: '75%',
                                height: '90%',
                                transform: 'translate(-50%, -50%)',
                                bgcolor: 'background.paper',
                                border: '2px solid #000',
                                boxShadow: 24,
                                p: 4,
                            }}>
                                <Typography variant="h6" id="modal-modal-title">
                                </Typography>
                                <Maps
                                    selectPosition={selectPosition}
                                    setSelectPosition={setSelectPosition}
                                />
                                <div style={{width: "50%", height: "90%"}}>
                                    <SearchBox
                                        selectPosition={selectPosition}
                                        setSelectPosition={setSelectPosition}
                                    />
                                </div>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setOpenModal(false)}
                                    style={{marginTop: 16}}
                                >
                                    Đóng
                                </Button>
                            </Box>
                        </Modal>
                    </TabPanel>

                    <TabPanel value="2">
                        <Box sx={{
                            marginTop: '-3%',
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                        }}>
                            <Box sx={{width: '100%', height: '500px', position: 'relative'}}>
                                <NextOrderInfo />
                                <EnhancedMap
                                    points={routingPoints}
                                    assignments={getActiveAssignments()} // Only pass active assignments to map
                                    onNextOrder={setNextOrder}
                                    nextOrder={nextOrder}
                                    hub={hub}
                                    role={role}
                                />
                            </Box>
                        </Box>
                    </TabPanel>

                    <TabPanel value="3">
                        <NextOrderInfo />
                        <Box sx={{ padding: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="h6" sx={{ marginBottom: 2 }}>
                                Tiến trình {actionProcessText} hàng
                            </Typography>
                            <Grid container spacing={2}>
                                {/* Tổng số điểm dừng */}
                                <Grid item xs={6}>
                                    <Box sx={{ padding: 2, backgroundColor: 'white', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            Tổng số điểm dừng
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: 'primary.main' }}>
                                            {assignmentData?.length}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ padding: 2, backgroundColor: 'white', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            Số điểm dừng hoàn thành
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
                                            {assignmentData?.filter(order => isAssignmentCompleted(order)).length}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Tổng số package */}
                                <Grid item xs={6}>
                                    <Box sx={{ padding: 2, backgroundColor: 'white', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            Tổng số đơn
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: 'primary.main' }}>
                                            {assignmentData?.length || 0}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Tổng số đơn đã thu/giao */}
                                <Grid item xs={6}>
                                    <Box sx={{ padding: 2, backgroundColor: 'white', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            Tổng số đơn {packageActionText}
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
                                            {assignmentData?.filter(order => order.assignmentStatus === "COMPLETED").length || 0}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </TabPanel>

                </TabContext>
            </Box>
        </Fragment>
    );
};

const SCR_ID = "SCR_ASSIGN_ORDER";
// export default withScreenSecurity(AssignOrder, SCR_ID, true);
export default TodayOrder;