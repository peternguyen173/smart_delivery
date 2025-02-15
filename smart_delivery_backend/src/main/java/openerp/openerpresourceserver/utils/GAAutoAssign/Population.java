package openerp.openerpresourceserver.utils.GAAutoAssign;


import lombok.Getter;
import openerp.openerpresourceserver.entity.Collector;
import openerp.openerpresourceserver.entity.Order;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

public class Population {
    @Getter
    private List<Individual> individuals;
    private int populationSize;
    private double crossoverRate;
    private double mutationRate;

    public Population(int populationSize, double crossoverRate, double mutationRate, List<Order> orderList, List<Collector> collectorList) {
        this.populationSize = populationSize;
        this.crossoverRate = crossoverRate;
        this.mutationRate = mutationRate;
        this.individuals = new ArrayList<>();

        for (int i = 0; i < populationSize; i++) {
            Individual individual = new Individual(orderList.size(), collectorList.size(), orderList);
            individual.randomInit();
            System.out.println("individual" + individual.getChromosome());
            this.individuals.add(individual);
        }
    }

    public Population(List<Individual> offspring, int populationSize, double crossoverRate, double mutationRate){
        this.individuals = offspring;
        this.populationSize = populationSize;
        this.crossoverRate = crossoverRate;
        this.mutationRate = mutationRate;
    }

    public void evaluateFitness() {
        for (Individual individual : individuals) {
            individual.calculateFitness();
        }
    }

    public List<Individual> selectParents() {
        List<Individual> selectedParents = new ArrayList<>();
        individuals.sort(Comparator.comparingDouble(Individual::getFitness).reversed());
        for (int i = 0; i < individuals.size() / 2; i++) {
            selectedParents.add(individuals.get(i));
        }
        return selectedParents;
    }

    public List<Individual> reproduct(List<Individual> parents) {
        List<Individual> offspring = new ArrayList<>();
        Random random = new Random();
        int parentSize = parents.size();

        while(offspring.size()< populationSize){
            int p1 = random.nextInt(parentSize);
            int p2 = random.nextInt(parentSize);
            while(p1 == p2) p2 = random.nextInt(parentSize);

            Individual parent1 = parents.get(p1);
            Individual parent2 = parents.get(p2);
            if ( random.nextDouble() < crossoverRate) {
                offspring.add(parent1.crossoverWith(parent2));
            }
        }


        return offspring;
    }

    public void mutate(List<Individual> offspring) {
        Random random = new Random();
        for (Individual individual : offspring) {
            if (random.nextDouble() < mutationRate) {
                individual.mutate();
            }
        }
    }

    public Individual findBestIndividual() {
        Individual bestIndividual = individuals.stream().max(Comparator.comparingDouble(Individual::getFitness)).orElse(null);
        System.out.println(bestIndividual.getFitness());
        return bestIndividual;
    }
}
