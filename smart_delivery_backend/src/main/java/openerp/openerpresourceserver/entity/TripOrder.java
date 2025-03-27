package openerp.openerpresourceserver.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

/**
 * Entity that represents the connection between an Order and a Trip.
 * This allows for many-to-many relationship tracking between orders and trips.
 */
@Entity
@Table(name = "smartdelivery_trip_order")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripOrder {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    /**
     * The sequence number for optimized order of pickup/delivery within the trip
     */
    @Column(name = "sequence_number")
    private Integer sequenceNumber;

    /**
     * Whether this order is picked up in this trip
     */
    @Column(name = "is_pickup")
    private Boolean isPickup;

    private Boolean delivered;

    /**
     * Whether this order is delivered in this trip
     */
    @Column(name = "is_delivery")
    private Boolean isDelivery;

    /**
     * The status of this order within the trip
     * Possible values: "PENDING", "PICKED_UP", "DELIVERED", "FAILED"
     */
    @Column(name = "status", nullable = false)
    private String status;

    /**
     * Any notes or comments about this order in the trip
     */
    @Column(name = "notes", length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Timestamp updatedAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = "PENDING";
        }
        if (isPickup == null) {
            isPickup = false;
        }
        if (isDelivery == null) {
            isDelivery = false;
        }
    }
}