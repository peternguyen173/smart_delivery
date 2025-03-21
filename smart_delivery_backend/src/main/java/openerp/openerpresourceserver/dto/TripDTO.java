package openerp.openerpresourceserver.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripDTO {
    private UUID id;
    private UUID routeScheduleId;
    private String routeName;
    private DayOfWeek dayOfWeek;
    private String status; // "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"
    private Instant startTime;
    private Instant endTime;
    private Integer currentStopIndex;
    private Integer totalStops;
    private Integer ordersCount;
    private Integer ordersDelivered;
}
