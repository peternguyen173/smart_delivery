import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Chip,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Grid,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { request } from 'api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RouteIcon from '@mui/icons-material/Route';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PlaceIcon from '@mui/icons-material/Place';
import DateRangeIcon from '@mui/icons-material/DateRange';
import MapIcon from '@mui/icons-material/Map';
import DirectionsIcon from '@mui/icons-material/Directions';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { errorNoti, successNoti } from 'utils/notification';

// Import the map component from your codebase
import { EnhancedMap } from 'components/map/EnhancedMap';

const DriverRouteMap = () => {
    const { routeVehicleId } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const tripId = queryParams.get('tripId');
    const history = useHistory();

    // State variables
    const [loading, setLoading] = useState(true);
    const [routeVehicle, setRouteVehicle] = useState(null);
    const [route, setRoute] = useState(null);
    const [stopSequence, setStopSequence] = useState([]);
    const [orders, setOrders] = useState([]);
    const [hub, setHub] = useState(null);
    const [nextOrder, setNextOrder] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [currentStop, setCurrentStop] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [confirmArrivalDialog, setConfirmArrivalDialog] = useState(false);
    const [selectedHub, setSelectedHub] = useState(null);
    const [operationType, setOperationType] = useState(null);

    // Map points and assignments
    const [mapPoints, setMapPoints] = useState([]);
    const [assignments, setAssignments] = useState([]);

    // Load data on component mount
    useEffect(() => {
        fetchRouteData();

        // Set up periodic location updates
        const locationInterval = setInterval(updateCurrentLocation, 30000); // Update every 30 seconds

        return () => {
            clearInterval(locationInterval);
        };
    }, [routeVehicleId, tripId]);

    // Update current location
    const updateCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error updating location:", error);
                }
            );
        }
    };

    // Fetch route data
    const fetchRouteData = async () => {
        try {
            setLoading(true);

            // If we have tripId, fetch trip details directly
            if (tripId) {
                await fetchTripDetails();
            } else {
                // Get route vehicle details from schedule-assignments
                await fetchRouteVehicleAssignment();
            }

            // Get driver's hub
            await fetchDriverHub();

            // Get current location
            updateCurrentLocation();

            setLoading(false);
        } catch (error) {
            console.error("Error fetching route data:", error);
            errorNoti("Failed to load route data");
            setLoading(false);
        }
    };

    // Fetch trip details
    const fetchTripDetails = async () => {
        try {
            await request('get', `/smdeli/driver/trips/${tripId}`, (tripRes) => {
                setActiveTrip(tripRes.data);

                // Set current stop from trip data
                if (tripRes.data && tripRes.data.currentStopIndex !== undefined) {
                    setCurrentStop(tripRes.data.currentStopIndex + 1); // Convert to 1-based for display
                }

                // Extract stop sequence
                if (tripRes.data && tripRes.data.stops) {
                    setStopSequence(tripRes.data.stops);

                    // Create map points from stops
                    const points = tripRes.data.stops.map(stop => ({
                        lat: stop.latitude || 0,
                        lng: stop.longitude || 0,
                        name: stop.hubName,
                        hubId: stop.hubId,
                        sequence: stop.stopSequence
                    }));
                    setMapPoints(points);
                }

                // Set orders from trip
                if (tripRes.data ) {
                    setOrders(tripRes.data.stops);

                    // Find next order to be delivered (first DELIVERING order)
                    console.log("ds",tripRes.data.stops);
                    const nextToDeliver = tripRes.data.stops[tripRes.data.currentStopIndex];
                    console.log("ds",nextToDeliver);
                    if (nextToDeliver) {
                        setNextOrder(nextToDeliver);
                    }

                    // Create assignments for map component
                    const orderAssignments = tripRes.data.stops.map(stop => ({
                        id: stop.id,
                    }));
                    setAssignments(orderAssignments);
                }

                // Set route info if available
                if (tripRes.data && tripRes.data.routeId) {
                    fetchRouteDetails(tripRes.data.routeId);
                }
            });
        } catch (error) {
            console.error("Error fetching trip details:", error);
        }
    };

    // Fetch route vehicle assignment
    const fetchRouteVehicleAssignment = async () => {
        try {
            // First try to use schedule assignments endpoint
            await request('get', `/smdeli/schedule-assignments/driver/get`, (res) => {
                const assignments = res.data || [];

                // Find the specific assignment
                const assignment = assignments.find(a =>
                    a.id === routeVehicleId || a.routeScheduleId === routeVehicleId);

                if (assignment) {
                    setRouteVehicle(assignment);

                    // Get route details if route ID exists
                    if (assignment.routeId) {
                        fetchRouteDetails(assignment.routeId);
                    } else if (assignment.routeScheduleId) {
                        // If we have scheduleId instead, we can try to get route info from it
                        fetchScheduleDetails(assignment.routeScheduleId);
                    }
                } else {
                    errorNoti("Vehicle assignment not found");
                }
            });
        } catch (error) {
            console.error("Error fetching route vehicle assignment:", error);

            // Fallback to check if the routeVehicleId is actually a scheduleId
            try {
                fetchScheduleDetails(routeVehicleId);
            } catch (secondError) {
                console.error("Failed fallback fetching schedule details:", secondError);
            }
        }
    };

    // Fetch schedule details
    const fetchScheduleDetails = async (scheduleId) => {
        try {
            await request('get', `/smdeli/route-scheduler/schedule/${scheduleId}`, (res) => {
                // If we have a route in the schedule, get its details
                if (res.data && res.data.routeId) {
                    fetchRouteDetails(res.data.routeId);
                }
            });
        } catch (error) {
            console.error("Error fetching schedule details:", error);
        }
    };

    // Fetch route details and stops
    const fetchRouteDetails = async (routeId) => {
        try {
            // Get route details
            await request('get', `/smdeli/middle-mile/routes/${routeId}`, (routeRes) => {
                setRoute(routeRes.data);

                // Get route stops
                request('get', `/smdeli/middle-mile/routes/${routeId}/stops`, (stopsRes) => {
                    const stops = stopsRes.data || [];

                    // If we don't already have stops from a trip, use these
                    if (stopSequence.length === 0) {
                        setStopSequence(stops);

                        // Create map points from stops
                        const points = stops.map(stop => ({
                            lat: stop.hubLatitude,
                            lng: stop.hubLongitude,
                            name: stop.hubName,
                            hubId: stop.hubId,
                            sequence: stop.stopSequence
                        }));

                        setMapPoints(points);
                    }

                    // Try to get orders using the trip assignment controller endpoint
                    if (tripId) {
                        request('get', `/smdeli/trip-assignments/trips/${tripId}/orders`, (ordersRes) => {
                            const orderData = ordersRes.data || [];
                            if (orders.length === 0) {
                                setOrders(orderData);
                            }
                        });
                    }
                });
            });
        } catch (error) {
            console.error("Error fetching route details:", error);
        }
    };

    // Fetch driver's hub
    const fetchDriverHub = async () => {
        try {
            const hubId = localStorage.getItem('hubId');
            if (hubId) {
                await request('get', `/smdeli/hubmanager/hub/${hubId}`, (res) => {
                    setHub({
                        id: res.data.id,
                        name: res.data.name,
                        address: res.data.address,
                        latitude: res.data.latitude,
                        longitude: res.data.longitude
                    });
                });
            }
        } catch (error) {
            console.error("Error fetching driver's hub:", error);
        }
    };

    // Navigation handlers
    const handleBack = () => {
        history.push('/middle-mile/driver/dashboard');
    };

    const handleViewOrders = () => {
        history.push(`/middle-mile/driver/orders/${tripId}`);
    };

    const handleCompleteTrip = () => {
        // Check if we're at the final stop
        if (currentStop < stopSequence.length) {
            errorNoti("You must be at the final stop to complete this trip");
            return;
        }

        if (window.confirm("Are you sure you want to complete this trip? This will mark all orders as delivered.")) {
            const endpoint = tripId
                ? `/smdeli/driver/trips/${tripId}/complete`
                : `/smdeli/driver/trips/${tripId}/complete`;

            request(
                'post',
                endpoint,
                () => {
                    successNoti("Trip completed successfully");
                    history.push('/middle-mile/driver/dashboard');
                },
                {
                    401: () => errorNoti("Unauthorized action"),
                    400: () => errorNoti("Unable to complete trip")
                }
            );
        }
    };

    // Start a new trip
    const handleStartTrip = () => {
        // Determine which ID to use - routeScheduleId from route vehicle, or the routeVehicleId param
        const scheduleIdToUse = routeVehicle?.routeScheduleId || routeVehicleId;

        request(
            'post',
            `/smdeli/driver/trip/start`,
            (res) => {
                successNoti("Trip started successfully");

                // If we got a trip ID back, navigate to the trip with ID
                if (res.data && res.data.id) {
                    const newTripId = res.data.id;
                    history.push(`/middle-mile/driver/route/${routeVehicleId}?tripId=${newTripId}`);
                } else {
                    setActiveTrip(res.data);
                    setCurrentStop(1);
                }
            },
            {
                401: () => errorNoti("Unauthorized action"),
                400: () => errorNoti("Unable to start trip")
            },
            { routeVehicleId: scheduleIdToUse }
        );
    };

    // Advance to next stop
    const handleAdvanceToNextStop = () => {
        if (!tripId) {
            errorNoti("No active trip found");
            return;
        }

        request(
            'post',
            `/smdeli/driver/trips/${tripId}/advance`,
            (res) => {
                successNoti("Advanced to next stop successfully");
                setActiveTrip(res.data);
                setCurrentStop(res.data.currentStopIndex + 1); // Convert to 1-based index

                // Refresh the full trip data
                fetchTripDetails();
            },
            {
                401: () => errorNoti("Unauthorized action"),
                400: () => errorNoti("Unable to advance to next stop")
            }
        );
    };

    // Handle arrival at a hub
    const handleArrivalAtHub = (hubId, stopNumber) => {
        // Find the hub details
        const hub = stopSequence.find(stop => stop.hubId === hubId);

        if (!hub) {
            errorNoti("Hub information not found");
            return;
        }

        setSelectedHub(hub);

        // Determine if this is a pickup or delivery hub
        // For simplicity, first stop is pickup, others are delivery
        const isPickup = stopNumber === 1;
        setOperationType(isPickup ? 'pickup' : 'delivery');

        setConfirmArrivalDialog(true);
    };

    // Proceed to hub operations
    const proceedToHubOperations = () => {
        if (!selectedHub || !operationType) {
            errorNoti("Missing hub information");
            return;
        }

        // Close dialog
        setConfirmArrivalDialog(false);

        // Navigate to the hub operations page
        const tripParam = tripId ? `&tripId=${tripId}` : '';
        history.push(`/middle-mile/driver/hub/${selectedHub.hubId}/${operationType}?routeVehicleId=${routeVehicleId}${tripParam}`);
    };

    // Show loading indicator
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ mb: 2 }}
            >
                Back to Dashboard
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Route Map: {activeTrip?.routeName || 'Loading...'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<MapIcon />}
                        onClick={handleViewOrders}
                    >
                        View Orders
                    </Button>

                    {tripId ? (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleCompleteTrip}
                            disabled={!stopSequence.length || currentStop < stopSequence.length}
                        >
                            Complete Trip
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleStartTrip}
                        >
                            Start Trip
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Trip information banner */}
            {activeTrip && (
                <Paper
                    sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: 'primary.light',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box>
                        <Typography variant="h6">
                            Active Trip - Stop {currentStop} of {stopSequence.length}
                        </Typography>
                        <Typography variant="body2">
                            Started: {new Date(activeTrip.startTime).toLocaleString()}
                        </Typography>
                    </Box>

                    {/*<Button*/}
                    {/*    variant="contained"*/}
                    {/*    color="secondary"*/}
                    {/*    onClick={handleAdvanceToNextStop}*/}
                    {/*    disabled={currentStop >= stopSequence.length}*/}
                    {/*>*/}
                    {/*    Next Stop*/}
                    {/*</Button>*/}
                </Paper>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <RouteIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                                <Typography variant="h6">
                                    Route Information
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Route
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {activeTrip?.routeName}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Orders
                                    </Typography>
                                    <Typography variant="body1">
                                        Picked up: {activeTrip?.ordersCount}  Delivered: {activeTrip?.ordersDelivered}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Chip
                                        label={activeTrip?.status}
                                        color={
                                            activeTrip?.status === 'IN_PROGRESS' ? 'warning' :
                                                activeTrip?.status === 'COMPLETED' ? 'success' : 'primary'
                                        }
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <DateRangeIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                                <Typography variant="h6">
                                    Route Stops
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {stopSequence.map((stop) => {
                                    // Determine stop status
                                    const stopNumber = stop.stopSequence;
                                    const isCurrent = currentStop === stopNumber;
                                    const isCompleted = currentStop > stopNumber;
                                    const isPending = currentStop < stopNumber;

                                    // Determine if this is a pickup or delivery hub
                                    const isOriginHub = stopNumber === 1;

                                    return (
                                        <Paper
                                            key={stop.id}
                                            elevation={isCurrent ? 3 : 1}
                                            sx={{
                                                mb: 1,
                                                p: 1,
                                                border: isCurrent ? '2px solid #4caf50' : 'none',
                                                position: 'relative'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: isCurrent ? 'success.main' : isCompleted ? 'success.light' : 'primary.main',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 1,
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    {stopNumber}
                                                </Typography>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle2">
                                                        {stop.hubName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <PlaceIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {stop.address || stop.hubAddress || 'No address available'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {isCurrent && activeTrip && (
                                                    <Chip
                                                        label="CURRENT"
                                                        color="success"
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Add action buttons for hub operations when at current stop */}
                                            {isCurrent && activeTrip && (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth
                                                    sx={{ mt: 1 }}
                                                    startIcon={isOriginHub ? <LocalShippingIcon /> : <CheckCircleIcon />}
                                                    onClick={() => handleArrivalAtHub(stop.hubId, stopNumber)}
                                                >
                                                    { isOriginHub
                                                        ? "I've arrived - Pickup Orders"
                                                        : "I've arrived - Deliver Orders"}
                                                </Button>
                                            )}

                                            {/* Show status indicator */}
                                            {isCompleted && (
                                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                                    <Typography variant="body2" color="success.main">
                                                        Completed
                                                    </Typography>
                                                </Box>
                                            )}

                                            {isPending && (
                                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Upcoming stop
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Paper>
                                    );
                                })}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card sx={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
                        <CardContent sx={{ height: '100%', p: 1 }}>
                            {mapPoints.length > 0 ? (
                                <EnhancedMap
                                    points={mapPoints}
                                    assignments={assignments}
                                    onNextOrder={(order) => setNextOrder(order)}
                                    nextOrder={nextOrder}
                                    hub={hub}
                                    currentLocation={currentLocation}
                                    currentStop={currentStop}
                                    nextPointLabel="Điểm tiếp theo" // Add this line to specify the Vietnamese label
                                />

                            ) : (
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography>No map points available</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Arrival confirmation dialog */}
            <Dialog
                open={confirmArrivalDialog}
                onClose={() => setConfirmArrivalDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {operationType === 'pickup' ? 'Pickup Orders' : 'Deliver Orders'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You've arrived at {selectedHub?.hubName}.
                        {operationType === 'pickup'
                            ? ' Ready to pick up orders from this hub?'
                            : ' Ready to deliver orders to this hub?'
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmArrivalDialog(false)}>Cancel</Button>
                    <Button
                        onClick={proceedToHubOperations}
                        variant="contained"
                        color="primary"
                        startIcon={operationType === 'pickup' ? <LocalShippingIcon /> : <CheckCircleIcon />}
                    >
                        Proceed
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DriverRouteMap;