package openerp.openerpresourceserver.service;

import openerp.openerpresourceserver.entity.Order;

public interface AssignOrderToHubService {
    void assignOrderToHub(Order order);
}
