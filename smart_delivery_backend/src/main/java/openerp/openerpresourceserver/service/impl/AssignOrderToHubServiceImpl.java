package openerp.openerpresourceserver.service.impl;

import jakarta.ws.rs.NotFoundException;
import lombok.extern.log4j.Log4j2;
import openerp.openerpresourceserver.entity.Hub;
import openerp.openerpresourceserver.entity.Order;
import openerp.openerpresourceserver.entity.Sender;
import openerp.openerpresourceserver.repository.HubRepo;
import openerp.openerpresourceserver.repository.SenderRepo;
import openerp.openerpresourceserver.service.AssignOrderToHubService;
import openerp.openerpresourceserver.utils.DistanceCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Log4j2
@Service
public class AssignOrderToHubServiceImpl implements AssignOrderToHubService {

    @Autowired
    private HubRepo hubRepo;
    @Autowired
    private SenderRepo senderRepo;

    @Override
    public void assignOrderToHub(Order order){
        Sender sender = senderRepo.findById(order.getSenderId()).orElseThrow(() -> new NotFoundException("sender not found"));
        Double x1 = sender.getLatitude();
        Double y1 = sender.getLongitude();

        List<Hub> hubs = hubRepo.findAll();

        Double min = Double.MAX_VALUE;
        Hub assignedHub = null;
        for(Hub hub : hubs){
            // tính khoảng cách kinh độ/vĩ độ trên bản đồ
            Double distance = DistanceCalculator.calculateDistance(x1,y1, hub.getLatitude(), hub.getLongitude() );

            if (distance < min)
            {
                min = distance;
                assignedHub = hub;
            }
        }
        if (assignedHub != null) {
            order.setOriginHubId(assignedHub.getHubId());
            order.setDistance(min);
        } else {
            // Xử lý trường hợp không tìm thấy hub gần nhất
            log.error("Không tìm thấy hub phù hợp cho order ID: " + order.getId());
        }

    }
}
