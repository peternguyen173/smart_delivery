package openerp.openerpresourceserver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import jakarta.ws.rs.ext.ParamConverter;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import openerp.openerpresourceserver.entity.enumentity.OrderStatus;
import openerp.openerpresourceserver.entity.enumentity.VehicleType;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import javax.sound.midi.Receiver;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "smartdelivery_order")
public class Order {
    @Id
    @GenericGenerator(name = "uuid1", strategy = "org.hibernate.id.UUIDGenerator")
    @GeneratedValue
    private UUID id;
    private UUID senderId;
    private String senderName;
    private UUID recipientId;
    private String recipientName;
    private UUID collectorId;
    private String collectorName;
    private UUID shipperId;
    private String shipperName;
    private UUID vehicleId;
    private VehicleType vehicleType;
    private String vehicleLicensePlate;
    private UUID driverId;
    private String driverName;
    private UUID routeId;
    private String orderType;
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // NEW, PROCESSING, COMPLETED
    private Double totalPrice;
    private Double shippingPrice;
    private Double finalPrice;
    private String origin;
    private String destinationAddress;
    private Date expectedDeliveryDate;
    private UUID originHubId;
    private String originHubName;
    private Double distance;
    private UUID finalHubId;
    private String finalHubName;
    private UUID routeVehicleId;
    @CreatedBy
    private String createdBy;
    private String approvedBy;
    private String cancelledBy;

    @CreationTimestamp
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

}
