package openerp.openerpresourceserver.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import openerp.openerpresourceserver.entity.enumentity.OrderStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;

import java.sql.Timestamp;
import java.util.Date;
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
    private String orderType;
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // NEW, PROCESSING, COMPLETED
    private Double weight;
    private Double length;
    private Double width;
    private Double height;
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
    private Integer collectAttemptCount=0;
    private Integer shipAttemptCount=0;
    private Integer deliverAttemptCount=0;
    @Version
    private Integer version;
    @CreatedBy
    private String createdBy;
    private String approvedBy;
    private String cancelledBy;

    @CreationTimestamp
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;
    private String changedBy;

    public Double getVolume() {
        if (length == null || width == null || height == null) {
            return null;
        }
        return length * width * height/1000000;
    }}
