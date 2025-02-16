package openerp.openerpresourceserver.utils.GAAutoAssign;


import openerp.openerpresourceserver.dto.OrderResponseDto;
import openerp.openerpresourceserver.entity.AssignOrderCollector;
import openerp.openerpresourceserver.entity.Collector;
import openerp.openerpresourceserver.entity.Hub;
import openerp.openerpresourceserver.entity.Order;
import openerp.openerpresourceserver.entity.enumentity.OrderStatus;
import openerp.openerpresourceserver.repository.AssignOrderCollectorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class GAAutoAssign {
    private static final int MAX_GENERATIONS = 100;
    private static final int POPULATION_SIZE = 50;
    private static final double CROSSOVER_RATE = 0.8;
    private static final double MUTATION_RATE = 0.1;

    @Autowired
    private AssignOrderCollectorRepository assignOrderCollectorRepository;

    public List<OrderResponseDto> autoAssignOrderToCollector(Hub hub, List<Order> orderList, List<Collector> collectorList) {
        Population population = new Population(POPULATION_SIZE, CROSSOVER_RATE, MUTATION_RATE, orderList, collectorList);
        Individual bestIndividual = null;

        for (int generation = 0; generation < MAX_GENERATIONS; generation++) {
            population.evaluateFitness();
            List<Individual> selectedParents = population.selectParents();
            List<Individual> offspring = population.reproduct(selectedParents);
            population.mutate(offspring);
            population = new Population(offspring, POPULATION_SIZE, CROSSOVER_RATE, MUTATION_RATE);
            System.out.println("population" + population.getIndividuals().size());
            bestIndividual = population.findBestIndividual();
        }

        for(Order order : orderList){
            order.setStatus(OrderStatus.ASSIGNED);
        }

        return generateResponse(bestIndividual, orderList, collectorList);
    }

    private List<OrderResponseDto> generateResponse(Individual bestIndividual, List<Order> orderList, List<Collector> collectorList) {
            List<OrderResponseDto> responses = new ArrayList<>();
            ArrayList<Integer> chromosome = bestIndividual.getChromosome(); // Lấy chromosome từ cá thể tốt nhất

            // Kiểm tra độ dài của chromosome và danh sách đơn hàng
            if (chromosome.size() != orderList.size()) {
                throw new IllegalStateException("Chromosome size does not match the number of orders.");
            }

            // Tạo map Collector -> List<Order>
            Map<Collector, List<Order>> collectorOrderMap = new HashMap<>();
            for (int i = 0; i < chromosome.size(); i++) {
                int collectorIndex = chromosome.get(i);
                Collector collector = collectorList.get(collectorIndex);

                collectorOrderMap
                        .computeIfAbsent(collector, k -> new ArrayList<>())
                        .add(orderList.get(i));
            }

            // Tạo danh sách AssignOrderCollector và lưu vào cơ sở dữ liệu
            List<AssignOrderCollector> assignments = new ArrayList<>();
            for (Map.Entry<Collector, List<Order>> entry : collectorOrderMap.entrySet()) {
                Collector collector = entry.getKey();
                for (Order order : entry.getValue()) {
                    // Lưu kết quả vào bảng AssignOrderCollector
                    AssignOrderCollector assignment = new AssignOrderCollector();
                    assignment.setOrderId(order.getId());
                    assignment.setCollectorId(collector.getId());
                    // Set các trường khác nếu cần (như createdBy, approvedBy, v.v.)
                    assignment.setCreatedBy("admin"); // Example, bạn có thể thay đổi

                    // Lưu vào database
                    assignments.add(assignment);
                }
            }
            // Lưu tất cả AssignOrderCollector vào cơ sở dữ liệu một lần
            this.assignOrderCollectorRepository.saveAll(assignments);

            // Tạo danh sách OrderResponse
            for (Map.Entry<Collector, List<Order>> entry : collectorOrderMap.entrySet()) {
                Collector collector = entry.getKey();
                for (Order order : entry.getValue()) {
                    responses.add(new OrderResponseDto().builder()
                            .id(order.getId())
                            .collectorId(collector.getId())
                            .build());
                }
            }

            return responses;
        }
}


