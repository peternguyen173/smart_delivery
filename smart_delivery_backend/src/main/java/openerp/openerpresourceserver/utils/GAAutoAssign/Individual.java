package openerp.openerpresourceserver.utils.GAAutoAssign;

import jakarta.ws.rs.NotFoundException;
import openerp.openerpresourceserver.entity.Order;
import openerp.openerpresourceserver.entity.Sender;
import openerp.openerpresourceserver.repository.SenderRepo;
import openerp.openerpresourceserver.utils.DistanceCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Component
public class Individual {

    @Autowired
    private SenderRepo senderRepo;

    private ArrayList<Integer> chromosome;
    private double fitness;
    private int numOfOrder;
    private int numOfCollector;
    private List<Order> orderList;

    public Individual(){
    }

    public Individual(int numOfOrder, int numOfCollector, List<Order> orderList) {
        this.fitness = -1;
        this.numOfOrder = numOfOrder;
        this.numOfCollector = numOfCollector;
        this.orderList = orderList;
        this.chromosome = new ArrayList<>();
    }

    public void randomInit() {
        Random rand = new Random();
        for (int i = 0; i < numOfOrder; i++) {
            chromosome.add(rand.nextInt(numOfCollector));
        }
    }

    public void calculateFitness() {
        Double maxSumDistance = 0.0;
        List<List<Integer>> ordersOfEachCollector = new ArrayList<>();

        for (int i = 0; i < numOfCollector; i++) {
            List<Integer> ordersOfCollector = new ArrayList<>();
            for (int j = 0; j < numOfOrder; j++) {
                if (this.chromosome.get(j) == i) {
                    ordersOfCollector.add(j);
                }
            }
            ordersOfEachCollector.add(ordersOfCollector);
        }

        for (List<Integer> orderNumbers : ordersOfEachCollector) {
            if (orderNumbers.isEmpty()) continue;

            Double totalDistance = 0.0;
            Integer currentOrderNumber = orderNumbers.get(0);

            for (int i = 1; i < orderNumbers.size(); i++) {
                Integer nextOrderNumber = orderNumbers.get(i);
                Sender sender1 =  senderRepo.findById(orderList.get(currentOrderNumber).getSenderId()).orElseThrow(() -> new NotFoundException("Sender not found"));
                Sender sender2 =  senderRepo.findById(orderList.get(nextOrderNumber).getSenderId()).orElseThrow(() -> new NotFoundException("Sender not found"));

                totalDistance += DistanceCalculator.calculateDistance(
                        sender1.getLatitude(),
                        sender1.getLongitude(),
                        sender2.getLatitude(),
                        sender2.getLongitude()
                );
                currentOrderNumber = nextOrderNumber;
            }

            if (totalDistance > maxSumDistance) {
                maxSumDistance = totalDistance;
            }
        }

        this.fitness =  1 / maxSumDistance;
    }

    public Individual crossoverWith(Individual other) {
        Individual child = new Individual(this.numOfOrder, this.numOfCollector, this.orderList);
        Random random = new Random();
        ArrayList<Integer> childChromosome = new ArrayList<>();

        for (int i = 0; i < this.chromosome.size(); i++) {
            if (random.nextBoolean()) {
                childChromosome.add(this.chromosome.get(i));
            } else {
                childChromosome.add(other.chromosome.get(i));
            }
        }

        child.chromosome = childChromosome;
        child.calculateFitness();
        return child;
    }

    public void mutate() {
        Random random = new Random();
        int index1 = random.nextInt(chromosome.size());
        int index2 = random.nextInt(chromosome.size());
        Collections.swap(chromosome, index1, index2);
    }

    public double getFitness() {
        return fitness;
    }

    public ArrayList<Integer> getChromosome() {
        return chromosome;
    }
}