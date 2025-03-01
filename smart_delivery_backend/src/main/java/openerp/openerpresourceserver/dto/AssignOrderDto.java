package openerp.openerpresourceserver.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class AssignOrderDto {
        private List<EmployeeDTO> collectors;
        private List<OrderRequestDto> orders;
        private UUID hubId;
}
