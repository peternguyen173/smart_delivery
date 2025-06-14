import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Tabs,
    Tab,
    Chip,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Grid,
    IconButton,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Alert,
    Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PlaceIcon from '@mui/icons-material/Place';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { request } from 'api';
import { errorNoti, successNoti } from 'utils/notification';
import DeleteIcon from "@mui/icons-material/Delete";

const DriverHubOperations = () => {
    // URL parameters and navigation
    const { hubId, operationType } = useParams();
    const history = useHistory();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const tripId = queryParams.get('tripId');
    const routeVehicleId = queryParams.get('routeVehicleId');

    // Redux state
    const username = useSelector((state) => state.auth.username);

    // State variables
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [hub, setHub] = useState(null);
    const [vehicle, setVehicle] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [deliveryWarningDialogOpen, setDeliveryWarningDialogOpen] = useState(false);
    const [operationLoading, setOperationLoading] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannedOrderId, setScannedOrderId] = useState("");
    const [notes, setNotes] = useState("");
    const [signatureOpen, setSignatureOpen] = useState(false);
    const [signatureData, setSignatureData] = useState(null);
    const [tripDetails, setTripDetails] = useState(null);
    const [recipientName, setRecipientName] = useState("");
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: [],
        destination: ""
    });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [processingComplete, setProcessingComplete] = useState(false);

    // Load data on component mount
    useEffect(() => {
        fetchHubData();
    }, [hubId, operationType, tripId]);

    // Fetch hub data
    const fetchHubData = async () => {
        setLoading(true);
        try {
            // Get hub details
            await request('get', `/smdeli/hubmanager/hub/${hubId}`, (res) => {
                setHub(res.data);
            });

            // Get driver's vehicle
            await request('get', `/smdeli/driver/vehicle`, (res) => {
                setVehicle(res.data);
            });

            // Get trip details if tripId is provided
            if (tripId) {
                await request('get', `/smdeli/driver/trips/${tripId}`, (res) => {
                    setTripDetails(res.data);
                });
            }

            // Get pending orders based on operation type
            await fetchOrderData();
        } catch (error) {
            console.error("Error loading data: ", error);
            errorNoti("Không thể tải dữ liệu hub");
        } finally {
            setLoading(false);
        }
    };

    // Fetch order data
    const fetchOrderData = async () => {
        try {
            let endpoint;
            if (operationType === 'pickup') {
                endpoint = `/smdeli/driver/trip/${tripId}/pending-pickups`;
            } else if (operationType === 'delivery') {
                // Since there's no specific endpoint for pending deliveries in the backend,
                // we'll use the current orders and filter them client-side
                endpoint = `/smdeli/driver/current-orders/${tripId}`;
            } else {
                showNotification("Loại hoạt động không hợp lệ", "error");
                return;
            }

            await request('get', endpoint, (res) => {
                let orders = res.data || [];
                // If we're in delivery mode, filter for orders that should be delivered to this hub
                if (operationType === 'delivery') {
                    orders = orders.filter(order => {
                        // Add your delivery filtering logic here based on your business rules
                        // For example, orders with DELIVERING status that match this hub
                        return order.status === 'DELIVERING';
                    });
                }
                setPendingOrders(orders);
                if (tripDetails && tripDetails.currentStopIndex === tripDetails.stops.length) {
                    setProcessingComplete(true);
                    showNotification("Không có đơn hàng để xử lý tại hub này", "info");
                } else {
                    showNotification(`${orders.length} đơn hàng sẵn sàng để ${operationType === 'pickup' ? 'lấy hàng' : 'giao hàng'}`, "info");
                }
            });
        } catch (error) {
            console.error("Error fetching orders: ", error);
            errorNoti("Không thể tải danh sách đơn hàng");
        }
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Toggle order selection
    const toggleOrderSelection = (orderId) => {
        if (selectedOrders.includes(orderId)) {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        } else {
            setSelectedOrders([...selectedOrders, orderId]);
        }
    };

    // Select all orders
    const selectAllOrders = () => {
        if (selectedOrders.length === getFilteredOrders().length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(getFilteredOrders().map(order => order.id));
        }
    };

    // Handle scanner input
    const handleScannerInput = (event) => {
        setScannedOrderId(event.target.value);
    };

    // Process scanned order
    const processScannedOrder = () => {
        // Check if the order ID is valid
        if (!scannedOrderId || scannedOrderId.trim() === "") {
            showNotification("Vui lòng nhập mã đơn hàng hợp lệ", "warning");
            return;
        }

        const order = pendingOrders.find(o => o.id === scannedOrderId);
        if (order) {
            if (!selectedOrders.includes(scannedOrderId)) {
                setSelectedOrders([...selectedOrders, scannedOrderId]);
                showNotification(`Đã thêm đơn hàng: ${scannedOrderId.substring(0, 8)}...`, "success");
            } else {
                showNotification(`Đơn hàng đã được chọn`, "info");
            }
            setScannedOrderId("");
        } else {
            showNotification(`Không tìm thấy đơn hàng hoặc không đủ điều kiện để ${operationType === 'pickup' ? 'lấy hàng' : 'giao hàng'}`, "error");
        }
        setScannerOpen(false);
    };

    // Handle Enter key press in scanner input
    const handleScannerKeyPress = (event) => {
        if (event.key === 'Enter') {
            processScannedOrder();
        }
    };

    // Open confirm dialog
    const openConfirmDialog = () => {
        // Bỏ validation này cho delivery
        if (operationType === 'pickup' && selectedOrders.length === 0) {
            showNotification("Vui lòng chọn ít nhất một đơn hàng", "warning");
            return;
        }

        // If delivery operation, check if all orders are selected
        if (operationType === 'delivery') {
            const totalOrders = getFilteredOrders().length;
            const selectedCount = selectedOrders.length;

            // If not all orders are selected, show warning dialog
            if (selectedCount < totalOrders) {
                setDeliveryWarningDialogOpen(true);
            } else {
                // All orders selected, proceed directly to signature
                setSignatureOpen(true);
            }
        } else {
            // Pickup operation, show normal confirm dialog
            setConfirmDialogOpen(true);
        }
    };
    const isLastStop = tripDetails &&
        tripDetails.stops &&
        tripDetails.currentStopIndex === tripDetails.stops.length - 1;

    // Process orders based on operation type
    const processOrders = async () => {


        setOperationLoading(true);
        try {
            if (operationType === 'pickup') {
                // Call pickup API
                await request(
                    'put',
                    '/smdeli/driver/pickup-orders',
                    (res) => {
                        showNotification(`Đã lấy ${selectedOrders.length} đơn hàng thành công`, "success");
                        // Update orders in state by removing the processed ones
                        setPendingOrders(pendingOrders.filter(order => !selectedOrders.includes(order.id)));
                        // Check if all orders have been processed
                        const remainingOrders = pendingOrders.filter(order => !selectedOrders.includes(order.id));
                        if (remainingOrders.length === 0) {
                            setProcessingComplete(true);
                        }
                        setSelectedOrders([]);
                        // If this is part of a trip and all orders were processed, offer to advance
                        if (tripId && remainingOrders.length === 0) {
                            if (window.confirm("Tất cả đơn hàng đã được xử lý. Chuyển đến điểm dừng tiếp theo?")) {
                                handleAdvanceToNextStop();
                            }
                        }
                    },
                    {
                        401: () => showNotification("Không có quyền thực hiện hành động này", "error"),
                        400: () => showNotification("Không thể lấy hàng", "error")
                    },
                    {
                        orderItemIds: selectedOrders,
                        tripId: tripId
                    }
                );
            } else if (operationType === 'delivery') {
                // Call deliver API with new format
                const allOrderIds = getFilteredOrders().map(order => order.id);
                const unselectedOrders = allOrderIds.filter(id => !selectedOrders.includes(id));

                const deliveryData = {
                    successOrderIds: selectedOrders,
                    failOrderIds: unselectedOrders.length > 0 ? unselectedOrders : null
                };

                await request(
                    'put',
                    '/smdeli/driver/deliver-orders',
                    (res) => {
                        const successCount = selectedOrders.length;
                        const failCount = unselectedOrders.length;

                        let message = `Đã giao ${successCount} đơn hàng thành công`;
                        if (failCount > 0) {
                            message += `, ${failCount} đơn hàng giao thất bại`;
                        }

                        showNotification(message, "success");

                        // Update orders in state by removing all processed ones
                        setPendingOrders([]);
                        setProcessingComplete(true);
                        setSelectedOrders([]);

                        // If this is part of a trip, offer to advance
                        if (tripId) {
                            if (window.confirm("Tất cả đơn hàng đã được xử lý. Chuyển đến điểm dừng tiếp theo?")) {
                                handleAdvanceToNextStop();
                            }
                        }
                    },
                    {
                        401: () => showNotification("Không có quyền thực hiện hành động này", "error"),
                        400: () => showNotification("Không thể giao hàng", "error")
                    },
                    deliveryData
                );
            }
        } catch (error) {
            console.error("Error processing orders: ", error);
            showNotification("Không thể xử lý đơn hàng", "error");
        } finally {
            setOperationLoading(false);
            setConfirmDialogOpen(false);
            setDeliveryWarningDialogOpen(false);
            setSignatureOpen(false);
        }
    };

    const handleCompleteTrip = async () => {
        if (!tripId) return;
        try {
            setOperationLoading(true);
            await request(
                'post',
                `/smdeli/driver/trips/${tripId}/complete`,
                () => {
                    showNotification("Hoàn thành chuyến đi thành công", "success");
                    // Navigate back to the dashboard
                    history.push('/middle-mile/driver/dashboard');
                },
                {
                    401: () => showNotification("Không có quyền thực hiện hành động này", "error"),
                    400: (err) => showNotification(err.response?.data?.message || "Không thể hoàn thành chuyến đi", "error"),
                    409: (err) => showNotification(err.response?.data?.message || "Hãy đợi nhân viên hub xác nhận!", "error")

                }
            );
        } catch (error) {
            console.error("Error completing trip: ", error);
            showNotification("Không thể hoàn thành chuyến đi", "error");
        } finally {
            setOperationLoading(false);
        }
    };

    // Handle signature capture
    const handleSignatureCapture = () => {
        // Simulate signature capture (in a real app, use a signature pad library)
        setSignatureData("signature-data-capture");
        showNotification("Đã lưu chữ ký", "success");
    };

    // Clear signature
    const clearSignature = () => {
        setSignatureData(null);
    };

    // Handle advancing to next stop in a trip
    const handleAdvanceToNextStop = async () => {
        if (!tripId) return;
        try {
            setOperationLoading(true);
            await request(
                'post',
                `/smdeli/driver/trips/${tripId}/advance`,
                (res) => {
                    showNotification("Đã chuyển đến điểm dừng tiếp theo", "success");
                    // Navigate back to the trip view
                    history.push(`/middle-mile/driver/route/${routeVehicleId}?tripId=${tripId}`);
                },
                {
                    401: () => showNotification("Không có quyền thực hiện hành động này", "error"),
                    400: (err) => showNotification(err.response?.data?.message || "Không thể chuyển đến điểm dừng tiếp theo", "error")
                }
            );
        } catch (error) {
            console.error("Error advancing to next stop: ", error);
            showNotification("Không thể chuyển đến điểm dừng tiếp theo", "error");
        } finally {
            setOperationLoading(false);
        }
    };

    // Apply filters to orders
    const getFilteredOrders = () => {
        return pendingOrders.filter(order => {
            // Filter by status if any statuses are selected
            if (filters.status.length > 0 && !filters.status.includes(order.status)) {
                return false;
            }
            // Filter by destination if specified
            if (filters.destination &&
                !order.recipientAddress?.toLowerCase().includes(filters.destination.toLowerCase()) &&
                !order.recipientName?.toLowerCase().includes(filters.destination.toLowerCase())) {
                return false;
            }
            return true;
        });
    };

    // Apply filters
    const applyFilters = () => {
        setFilterDialogOpen(false);
        const filteredCount = getFilteredOrders().length;
        showNotification(`Hiển thị ${filteredCount} trong ${pendingOrders.length} đơn hàng`, "info");
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: [],
            destination: ""
        });
    };

    // Show notification
    const showNotification = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Go back to dashboard or trip view
    const handleBack = () => {
        if (tripId) {
            // If we came from a trip, go back to trip view
            history.push(`/middle-mile/driver/route/${routeVehicleId}?tripId=${tripId}`);
        } else {
            // Otherwise go to dashboard
            history.push('/middle-mile/driver/dashboard');
        }
    };

    // Show loading indicator when fetching data
    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh">
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h6">Đang tải hoạt động hub...</Typography>
            </Box>
        );
    }

    // Get filtered orders
    const filteredOrders = getFilteredOrders();

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 3, mb: 6 }}>
                {/* Header with back button */}


                {/* Hub Information Card */}
                {hub && (
                    <Card sx={{ mb: 4, boxShadow: 3, bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent sx={{ p: 3 }}>
                            {/* Header with back button and title */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <IconButton onClick={handleBack} sx={{ mr: 2, color: 'white' }}>
                                    <ArrowBackIcon />
                                </IconButton>
                                <PlaceIcon fontSize="large" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography variant="h5" sx={{ opacity: 0.9 }}>
                                        {hub.name} ({hub.code})
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {hub.address}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Information Grid */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Loại hoạt động:</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {operationType === 'pickup' ? 'Lấy hàng' : 'Giao hàng'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Phương tiện:</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {vehicle?.plateNumber} ({vehicle?.vehicleType})
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Đơn hàng chờ xử lý:</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {pendingOrders.length} {operationType === 'pickup' ? 'cần lấy' : 'cần giao'}
                                    </Typography>
                                </Grid>
                                {tripDetails && (
                                    <Grid item xs={12} sm={6} md={2}>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            <LocalShippingIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                            Chuyến đi:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {isLastStop ? 'Điểm cuối' : `Điểm ${tripDetails.currentStopIndex + 1}/${tripDetails.stops?.length}`}
                                        </Typography>
                                    </Grid>

                                )}
                                <Grid item xs={12} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {isLastStop ? 'Điểm đến cuối' : 'Điểm dừng tiếp theo:'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {isLastStop
                                            ? tripDetails.stops?.[tripDetails.currentStopIndex]?.hubName
                                            : tripDetails.stops?.[tripDetails.currentStopIndex + 1]?.hubName || 'Kết thúc tuyến đường'}
                                    </Typography>
                                </Grid>

                            </Grid>

                        </CardContent>
                    </Card>
                )}

                {processingComplete && (
                    <Alert
                        severity="success"
                        sx={{ mb: 3 }}
                        action={
                            tripId && (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={isLastStop ? handleCompleteTrip : handleAdvanceToNextStop}
                                >
                                    {isLastStop ? 'HOÀN THÀNH CHUYẾN ĐI' : 'ĐIỂM DỪNG TIẾP THEO'}
                                </Button>
                            )
                        }
                    >
                        <Typography variant="subtitle1">
                            Tất cả đơn hàng đã được xử lý tại hub này
                        </Typography>
                        {tripId
                            ? isLastStop
                                ? "Bạn đã đến điểm dừng cuối cùng. Bây giờ bạn có thể hoàn thành chuyến đi."
                                : "Bây giờ bạn có thể chuyển đến điểm dừng tiếp theo trong tuyến đường."
                            : "Bây giờ bạn có thể quay lại dashboard."
                        }
                    </Alert>
                )}

                {/* Orders Section */}
                <Card sx={{ mb: 3, boxShadow: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                            <Tab label={`Đơn hàng chờ xử lý (${filteredOrders.length})`} />
                            <Tab label={`Đã chọn (${selectedOrders.length})`} disabled={selectedOrders.length === 0} />
                        </Tabs>

                        {activeTab === 0 && (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => setFilterDialogOpen(true)}
                                            sx={{ mr: 1 }}
                                        >
                                            Lọc
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={selectAllOrders}
                                            disabled={filteredOrders.length === 0}
                                        >
                                            {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </Button>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        startIcon={<QrCodeScannerIcon />}
                                        onClick={() => setScannerOpen(true)}
                                        disabled={pendingOrders.length === 0}
                                    >
                                        Quét mã
                                    </Button>
                                </Box>

                                {filteredOrders.length === 0 ? (
                                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                                        <InventoryIcon color="disabled" sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
                                        <Typography variant="h6" color="text.secondary">
                                            Không tìm thấy đơn hàng chờ xử lý
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {pendingOrders.length > 0 ? 'Thử thay đổi bộ lọc' : 'Tất cả đơn hàng đã được xử lý'}
                                        </Typography>
                                        {pendingOrders.length === 0 && tripId && (
                                            <Button
                                                variant="contained"
                                                color={isLastStop ? "success" : "primary"}
                                                sx={{ mt: 3 }}
                                                onClick={isLastStop ? handleCompleteTrip : handleAdvanceToNextStop}
                                            >
                                                {isLastStop ? 'Hoàn thành chuyến đi' : 'Chuyển đến điểm dừng tiếp theo'}
                                            </Button>
                                        )}
                                    </Paper>
                                ) : (
                                    <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                                        {filteredOrders.map((order) => (
                                            <Paper
                                                key={order.id}
                                                sx={{
                                                    mb: 2,
                                                    boxShadow: 1,
                                                    borderLeft: selectedOrders.includes(order.id) ?
                                                        '5px solid #2196f3' : 'none'
                                                }}
                                            >
                                                <ListItem
                                                    button
                                                    onClick={() => toggleOrderSelection(order.id)}
                                                    secondaryAction={
                                                        <Checkbox
                                                            edge="end"
                                                            checked={selectedOrders.includes(order.id)}
                                                            onChange={() => toggleOrderSelection(order.id)}
                                                        />
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 4 }}>
                                                                <Typography variant="subtitle1">
                                                                    #{order.id.substring(0, 8)}...
                                                                </Typography>
                                                                <Chip
                                                                    label={order.status}
                                                                    color={
                                                                        order.status === 'COLLECTED_HUB' ? 'info' :
                                                                            order.status === 'DELIVERING' ? 'warning' : 'default'
                                                                    }
                                                                    size="small"
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                                <Grid item xs={12} sm={6}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                                        Từ:
                                                                    </Typography>
                                                                    <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                                                        {order.senderName || "Không xác định"}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={12} sm={6}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                                        Đến:
                                                                    </Typography>
                                                                    <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                                                        {order.recipientName || "Không xác định"}
                                                                    </Typography>
                                                                </Grid>
                                                                {order.createdAt && (
                                                                    <Grid item xs={12}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Tạo lúc: {new Date(order.createdAt).toLocaleString()}
                                                                        </Typography>
                                                                    </Grid>
                                                                )}
                                                            </Grid>
                                                        }
                                                    />
                                                </ListItem>
                                            </Paper>
                                        ))}
                                    </List>
                                )}
                            </>
                        )}

                        {activeTab === 1 && (
                            <>
                                <Box sx={{ mb: 2 }}>
                                    <Alert severity="info">
                                        {selectedOrders.length} đơn hàng được chọn để {operationType === 'pickup' ? 'lấy hàng' : 'giao hàng'}
                                    </Alert>
                                </Box>
                                <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                                    {pendingOrders
                                        .filter(order => selectedOrders.includes(order.id))
                                        .map(order => (
                                            <Paper key={order.id} sx={{ mb: 2, boxShadow: 1, borderLeft: '5px solid #2196f3' }}>
                                                <ListItem
                                                    secondaryAction={
                                                        <IconButton edge="end" onClick={() => toggleOrderSelection(order.id)}>
                                                            <Checkbox checked={true} />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="subtitle1">
                                                                    #{order.id.substring(0, 8)}...
                                                                </Typography>
                                                                <Chip
                                                                    label={order.status}
                                                                    color={
                                                                        order.status === 'COLLECTED_HUB' ? 'info' :
                                                                            order.status === 'DELIVERING' ? 'warning' : 'default'
                                                                    }
                                                                    size="small"
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                                <Grid item xs={12} sm={6}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                                        Từ:
                                                                    </Typography>
                                                                    <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                                                        {order.senderName || "Không xác định"}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={12} sm={6}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                                        Đến:
                                                                    </Typography>
                                                                    <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                                                        {order.recipientName || "Không xác định"}
                                                                    </Typography>
                                                                </Grid>
                                                                {order.createdAt && (
                                                                    <Grid item xs={12}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Tạo lúc: {new Date(order.createdAt).toLocaleString()}
                                                                        </Typography>
                                                                    </Grid>
                                                                )}
                                                            </Grid>
                                                        }
                                                    />
                                                </ListItem>
                                            </Paper>
                                        ))}
                                </List>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Action Button - Only show if there are pending orders */}
                {/* Action Button - Only show if there are pending orders */}
                {!processingComplete && pendingOrders.length > 0 && (
                    <Box sx={{ position: 'fixed', bottom: 24, left: 0, right: 0, textAlign: 'center', zIndex: 100 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={
                                (operationType === 'pickup' && selectedOrders.length === 0) ||
                                operationLoading
                            }
                            onClick={openConfirmDialog}
                            startIcon={operationType === 'pickup' ? <LocalShippingIcon /> : <CheckCircleIcon />}
                            sx={{
                                px: 6,
                                py: 1.5,
                                borderRadius: 8,
                                boxShadow: 4
                            }}
                        >
                            {operationLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                operationType === 'pickup'
                                    ? `Lấy ${selectedOrders.length} đơn hàng`
                                    : selectedOrders.length === 0
                                        ? `Đánh dấu tất cả giao thất bại`
                                        : `Giao ${selectedOrders.length} đơn hàng`
                            )}
                        </Button>
                    </Box>
                )}

                {/* Confirmation Dialog for Pickup */}
                <Dialog
                    open={confirmDialogOpen}
                    onClose={() => !operationLoading && setConfirmDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Xác nhận lấy hàng
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Bạn có chắc chắn muốn lấy {selectedOrders.length} đơn hàng từ {hub?.name}?
                        </DialogContentText>
                        <Box sx={{ mt: 3, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Đơn hàng đã chọn:
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 1, maxHeight: 120, overflow: 'auto' }}>
                                {selectedOrders.map(id => {
                                    const order = pendingOrders.find(o => o.id === id);
                                    return order ? (
                                        <Chip
                                            key={id}
                                            label={`#${id.substring(0, 8)}`}
                                            size="small"
                                            sx={{ m: 0.5 }}
                                        />
                                    ) : null;
                                })}
                            </Paper>
                        </Box>
                        <TextField
                            margin="dense"
                            label="Ghi chú (tùy chọn)"
                            fullWidth
                            multiline
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setConfirmDialogOpen(false)}
                            disabled={operationLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={processOrders}
                            variant="contained"
                            color="primary"
                            disabled={operationLoading}
                        >
                            {operationLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Xác nhận'
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delivery Warning Dialog */}
                <Dialog
                    open={deliveryWarningDialogOpen}
                    onClose={() => !operationLoading && setDeliveryWarningDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WarningIcon color="warning" sx={{ mr: 1 }} />
                            Cảnh báo giao hàng
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Bạn chỉ chọn {selectedOrders.length} trong tổng số {getFilteredOrders().length} đơn hàng.
                        </DialogContentText>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Lưu ý quan trọng:
                            </Typography>
                            <Typography variant="body2">
                                • Các đơn hàng được chọn sẽ được đánh dấu là <strong>giao thành công</strong><br/>
                                • Các đơn hàng không được chọn sẽ được đánh dấu là <strong>giao thất bại</strong><br/>
                                • Hành động này không thể hoàn tác
                            </Typography>
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            Bạn có muốn tiếp tục với {selectedOrders.length} đơn hàng được chọn không?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setDeliveryWarningDialogOpen(false)}
                            disabled={operationLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={() => {
                                setDeliveryWarningDialogOpen(false);
                                setSignatureOpen(true);
                            }}
                            variant="contained"
                            color="warning"
                            disabled={operationLoading}
                        >
                            Tiếp tục
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Signature Dialog for Delivery */}
                <Dialog
                    open={signatureOpen}
                    onClose={() => !operationLoading && setSignatureOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Xác nhận giao hàng bằng chữ ký</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Vui lòng lấy chữ ký để xác nhận giao {selectedOrders.length} đơn hàng tại {hub?.name}.
                        </DialogContentText>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={7}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Khu vực chữ ký:
                                </Typography>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        height: 200,
                                        width: '100%',
                                        border: '1px solid #ccc',
                                        position: 'relative'
                                    }}
                                >
                                    {/* This simulates a signature pad component */}
                                    {/* In a real implementation, you would use a proper signature component */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#fafafa',
                                            cursor: 'crosshair',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onClick={handleSignatureCapture}
                                    >
                                        {signatureData ? (
                                            <Typography variant="h6" color="primary">
                                                ✓ Đã lưu chữ ký
                                            </Typography>
                                        ) : (
                                            <Typography color="text.secondary">
                                                Nhấn vào đây để ký
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    onClick={clearSignature}
                                    disabled={!signatureData}
                                >
                                    Xóa chữ ký
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Chi tiết giao hàng:
                                </Typography>
                                <TextField
                                    margin="dense"
                                    label="Tên người nhận"
                                    fullWidth
                                    required
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    margin="dense"
                                    label="Ghi chú (tùy chọn)"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setSignatureOpen(false)}
                            disabled={operationLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={processOrders}
                            variant="contained"
                            color="primary"
                            disabled={operationLoading || !signatureData || !recipientName}
                        >
                            {operationLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Xác nhận giao hàng'
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Scanner Dialog */}
                <Dialog
                    open={scannerOpen}
                    onClose={() => setScannerOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <QrCodeScannerIcon sx={{ mr: 1 }} />
                            Quét mã QR đơn hàng
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Nhập hoặc quét mã đơn hàng bằng máy quét mã vạch
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Mã đơn hàng"
                            fullWidth
                            variant="outlined"
                            value={scannedOrderId}
                            onChange={handleScannerInput}
                            onKeyPress={handleScannerKeyPress}
                            sx={{ mb: 2 }}
                        />
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Đảm bảo máy quét được cấu hình để phát ra phím Enter sau khi quét
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setScannerOpen(false)}>Hủy</Button>
                        <Button
                            onClick={processScannedOrder}
                            variant="contained"
                            color="primary"
                            disabled={!scannedOrderId}
                        >
                            Thêm đơn hàng
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Filter Dialog */}
                <Dialog
                    open={filterDialogOpen}
                    onClose={() => setFilterDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Lọc đơn hàng</DialogTitle>
                    <DialogContent>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                            Trạng thái:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {['CONFIRMED_OUT','COLLECTED_HUB', 'DELIVERING'].map(status => (
                                <Chip
                                    key={status}
                                    label={status}
                                    color={filters.status.includes(status) ? 'primary' : 'default'}
                                    onClick={() => {
                                        if (filters.status.includes(status)) {
                                            setFilters({
                                                ...filters,
                                                status: filters.status.filter(s => s !== status)
                                            });
                                        } else {
                                            setFilters({
                                                ...filters,
                                                status: [...filters.status, status]
                                            });
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Địa chỉ đến:
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Tìm kiếm theo địa chỉ đến hoặc tên người nhận"
                            value={filters.destination}
                            onChange={(e) => setFilters({
                                ...filters,
                                destination: e.target.value
                            })}
                            sx={{ mb: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={resetFilters} color="inherit">
                            Đặt lại bộ lọc
                        </Button>
                        <Button onClick={() => setFilterDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={applyFilters} variant="contained" color="primary">
                            Áp dụng bộ lọc
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setSnackbarOpen(false)}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                    {operationType === 'pickup' ? 'Lấy hàng' : 'Giao hàng'}
                </Typography>
            </Box>
        </Container>

    );
};

export default DriverHubOperations;