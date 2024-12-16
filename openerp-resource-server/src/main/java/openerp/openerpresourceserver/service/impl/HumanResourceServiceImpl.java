package openerp.openerpresourceserver.service.impl;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import lombok.extern.slf4j.Slf4j;
import openerp.openerpresourceserver.entity.Collector;
import openerp.openerpresourceserver.entity.Driver;
import openerp.openerpresourceserver.entity.Hub;
import openerp.openerpresourceserver.entity.Shipper;
import openerp.openerpresourceserver.entity.enumentity.Role;
import openerp.openerpresourceserver.repo.CollectorRepo;
import openerp.openerpresourceserver.repo.DriverRepo;
import openerp.openerpresourceserver.repo.HubRepo;
import openerp.openerpresourceserver.repo.ShipperRepo;
import openerp.openerpresourceserver.request.EmployeeRequest;
import openerp.openerpresourceserver.response.EmployeeDetailDTO;
import openerp.openerpresourceserver.response.EmployeeResponse;
import openerp.openerpresourceserver.service.HumanResourceService;
import openerp.openerpresourceserver.service.KeycloakAdminClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class HumanResourceServiceImpl implements HumanResourceService {

    @Autowired
    private ShipperRepo shipperRepo;
    @Autowired
    private CollectorRepo collectorRepo;
    @Autowired
    private DriverRepo driverRepo;
    @Autowired
    private HubRepo hubRepo;
    @Autowired
    private KeycloakAdminClient keycloakAdminClient;

    @Override
    public List<Shipper> getAllShipper(){
        return shipperRepo.findAll();
    }

    @Override
    public EmployeeDetailDTO getShipperById(UUID id) {
        Shipper shipper = shipperRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Shipper not found with id: " + id));

        // Chuyển đổi từ Entity sang eDTO
        return convertToResponseSDTO(shipper);
    }

    @Override
    public List<Collector> getAllCollector(){
        return collectorRepo.findAll();
    }

    @Override
    public EmployeeDetailDTO getCollectorById(UUID id) {
        Collector collector = collectorRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Collector not found with id: " + id));

        // Chuyển đổi từ Entity sang eDTO
        return convertToResponseDTO(collector);
    }


//    @Override
//    public EmployeeDetailDTO getCollectorById(UUID id) {
//        Collector collector = collectorRepo.findById(id)
//                .orElseThrow(() -> new NotFoundException("Collector not found with id: " + id));
//
//        // Chuyển đổi từ Entity sang eDTO
//        return convertToResponseDTO(collector);
//    }

    @Override
    public List<Driver> getAllDriver(){
        return driverRepo.findAll();
    }

    @Override
    public EmployeeDetailDTO getDriverById(UUID id) {
        Driver driver = driverRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Driver not found with id: " + id));

        // Chuyển đổi từ Entity sang eDTO
        return convertToResponseDDTO(driver);
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public EmployeeResponse addEmployee(EmployeeRequest employeeRequest) {

        try {

            // Register user in Keycloak
        keycloakAdminClient.createUserInKeycloak(employeeRequest);

        // Save employee information to the database based on their role
        Hub hub = hubRepo.findById(employeeRequest.getHub()).orElseThrow(() -> new NotFoundException("not found hub"));
        System.out.println(employeeRequest);
        if (employeeRequest.getRole() == Role.COLLECTOR) {
            Collector newCollector = new Collector();
            newCollector.setName(employeeRequest.getName());
            newCollector.setEmail(employeeRequest.getEmail());
            newCollector.setPhone(employeeRequest.getPhone());
            newCollector.setHub(hub);
            newCollector.setAddress(employeeRequest.getAddress());
            newCollector.setCity(employeeRequest.getCity());
            newCollector.setDistrict(employeeRequest.getDistrict());
            newCollector.setWard(employeeRequest.getWard());
            newCollector.setUsername(employeeRequest.getUsername());
            newCollector.setPassword(employeeRequest.getPassword());
            Collector saved = collectorRepo.save(newCollector);
            return new EmployeeResponse(saved.getId(), saved.getName());
        } else if (employeeRequest.getRole() == Role.DRIVER) {
            Driver newDriver = new Driver();
            newDriver.setName(employeeRequest.getName());
            newDriver.setEmail(employeeRequest.getEmail());
            newDriver.setPhone(employeeRequest.getPhone());
            newDriver.setOriginHub(hub);
            newDriver.setAddress(employeeRequest.getAddress());
            newDriver.setCity(employeeRequest.getCity());
            newDriver.setDistrict(employeeRequest.getDistrict());
            newDriver.setWard(employeeRequest.getWard());
            newDriver.setUsername(employeeRequest.getUsername());
            newDriver.setPassword(employeeRequest.getPassword());
            Driver saved = driverRepo.save(newDriver);
            return new EmployeeResponse(saved.getId(), saved.getName());
        } else if (employeeRequest.getRole() == Role.SHIPPER) {
            Shipper newShipper = new Shipper();
            newShipper.setName(employeeRequest.getName());
            newShipper.setEmail(employeeRequest.getEmail());
            newShipper.setPhone(employeeRequest.getPhone());
            newShipper.setHub(hub);
            newShipper.setAddress(employeeRequest.getAddress());
            newShipper.setCity(employeeRequest.getCity());
            newShipper.setDistrict(employeeRequest.getDistrict());
            newShipper.setWard(employeeRequest.getWard());
            newShipper.setUsername(employeeRequest.getUsername());
            newShipper.setPassword(employeeRequest.getPassword());
            Shipper saved = shipperRepo.save(newShipper);
            return new EmployeeResponse(saved.getId(), saved.getName());
        }

        throw new IllegalArgumentException("Invalid role: " + employeeRequest.getRole());
        }
        catch (RuntimeException e) {
            throw new IllegalStateException("Failed to create user in Keycloak", e);
        }
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public EmployeeResponse updateEmployee(EmployeeRequest employeeRequest) {

        try {

            // Register user in Keycloak
            //keycloakAdminClient.updateUserInKeycloak(employeeRequest);

            // Save employee information to the database based on their role
            Hub hub = hubRepo.findById(employeeRequest.getHub()).orElseThrow(() -> new NotFoundException("not found hub"));
            System.out.println(employeeRequest);
            if (employeeRequest.getRole() == Role.COLLECTOR) {
                Collector newCollector = new Collector();
                newCollector.setId(employeeRequest.getId());
                newCollector.setName(employeeRequest.getName());
                newCollector.setEmail(employeeRequest.getEmail());
                newCollector.setPhone(employeeRequest.getPhone());
                newCollector.setHub(hub);
                newCollector.setAddress(employeeRequest.getAddress());
                newCollector.setCity(employeeRequest.getCity());
                newCollector.setDistrict(employeeRequest.getDistrict());
                newCollector.setWard(employeeRequest.getWard());
                newCollector.setUsername(employeeRequest.getUsername());
                newCollector.setPassword(employeeRequest.getPassword());
                Collector saved = collectorRepo.save(newCollector);
                return new EmployeeResponse(saved.getId(), saved.getName());
            } else if (employeeRequest.getRole() == Role.DRIVER) {
                Driver newDriver = new Driver();
                newDriver.setId(employeeRequest.getId());
                newDriver.setName(employeeRequest.getName());
                newDriver.setEmail(employeeRequest.getEmail());
                newDriver.setPhone(employeeRequest.getPhone());
                newDriver.setOriginHub(hub);
                newDriver.setAddress(employeeRequest.getAddress());
                newDriver.setCity(employeeRequest.getCity());
                newDriver.setDistrict(employeeRequest.getDistrict());
                newDriver.setWard(employeeRequest.getWard());
                newDriver.setUsername(employeeRequest.getUsername());
                newDriver.setPassword(employeeRequest.getPassword());
                Driver saved = driverRepo.save(newDriver);
                return new EmployeeResponse(saved.getId(), saved.getName());
            } else if (employeeRequest.getRole() == Role.SHIPPER) {
                Shipper newShipper = new Shipper();
                newShipper.setId(employeeRequest.getId());
                newShipper.setName(employeeRequest.getName());
                newShipper.setEmail(employeeRequest.getEmail());
                newShipper.setPhone(employeeRequest.getPhone());
                newShipper.setHub(hub);
                newShipper.setAddress(employeeRequest.getAddress());
                newShipper.setCity(employeeRequest.getCity());
                newShipper.setDistrict(employeeRequest.getDistrict());
                newShipper.setWard(employeeRequest.getWard());
                newShipper.setUsername(employeeRequest.getUsername());
                newShipper.setPassword(employeeRequest.getPassword());
                Shipper saved = shipperRepo.save(newShipper);
                return new EmployeeResponse(saved.getId(), saved.getName());
            }

            throw new IllegalArgumentException("Invalid role: " + employeeRequest.getRole());
        }
        catch (RuntimeException e) {
            throw new IllegalStateException("Failed to create user in Keycloak", e);
        }
    }
    @Override
    public Shipper addShipper(UUID shipperId, UUID hubId){
        Shipper shipper = shipperRepo.findById(shipperId)
                .orElseThrow(() -> new RuntimeException("Shipper not found with id: " + shipperId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));
        shipper.setHub(hub);
        return shipperRepo.save(shipper);
    }

    @Override
    public void removeShipper(UUID shipperId, UUID hubId){
        Shipper shipper = shipperRepo.findById(shipperId)
                .orElseThrow(() -> new RuntimeException("Shipper not found with id: " + shipperId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));

        hub.getShipperList().remove(shipper);
        hubRepo.save(hub);
    }

    @Override
    public Collector addCollector(UUID collectorId, UUID hubId){
        Collector collector = collectorRepo.findById(collectorId)
                .orElseThrow(() -> new RuntimeException("Shipper not found with id: " + collectorId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));
        collector.setHub(hub);
        return collectorRepo.save(collector);
    }

    @Override
    public void removeCollector(UUID collectorId, UUID hubId){
        Collector collector = collectorRepo.findById(collectorId)
                .orElseThrow(() -> new RuntimeException("Collector not found with id: " + collectorId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));

        hub.getCollectorList().remove(collector);
        hubRepo.save(hub);
    }

    @Override
    public Driver addDriverToOriginHub(UUID driverId, UUID hubId){
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));
        driver.setOriginHub(hub);
        return driverRepo.save(driver);
    }

    @Override
    public Driver addDriverToFinalHub(UUID driverId, UUID hubId){
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));
        driver.setFinalHub(hub);
        return driverRepo.save(driver);
    }

    @Override
    public void removeDriverFromOriginHub(UUID driverId, UUID hubId){
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));
        hub.getOriginDriverList().remove(driver);
        hubRepo.save(hub);
    }

    @Override
    public void removeDriverFromFinalHub(UUID driverId, UUID hubId){
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        Hub hub = hubRepo.findById(hubId)
                .orElseThrow(() -> new RuntimeException("Hub not found with id: " + hubId));
        hub.getFinalDriverList().remove(driver);
        hubRepo.save(hub);
    }

    @Override
    public void deleteShipper(UUID shipperId){
        Shipper shipper = shipperRepo.findById(shipperId).orElseThrow(() -> new NotFoundException("Shipper not found with id: " + shipperId));
        shipperRepo.delete(shipper);
    }

    @Override
    public void deleteCollector(UUID collectorId){
        System.out.println("delete");
        Collector collector = collectorRepo.findById(collectorId).orElseThrow(() -> new NotFoundException("Shipper not found with id: " + collectorId));
        collectorRepo.delete(collector);
    }

    @Override
    public void deleteDriver(UUID driverId){
        Driver driver = driverRepo.findById(driverId).orElseThrow(() -> new NotFoundException("Shipper not found with id: " + driverId));
        driverRepo.delete(driver);
    }

    private EmployeeDetailDTO convertToResponseDTO(Collector collector) {

        return new EmployeeDetailDTO(
                collector.getId(),
                collector.getName(),
                collector.getUsername(),
                collector.getPassword(),
                collector.getEmail(),
                collector.getPhone(),
                collector.getAddress(),
                collector.getCity(),
                collector.getDistrict(),
                collector.getWard(),
                collector.getHub().getHubId(),
                collector.getHub().getName()
        );
    }
    private EmployeeDetailDTO convertToResponseSDTO(Shipper collector) {

        return new EmployeeDetailDTO(
                collector.getId(),
                collector.getName(),
                collector.getUsername(),
                collector.getPassword(),
                collector.getEmail(),
                collector.getPhone(),
                collector.getAddress(),
                collector.getCity(),
                collector.getDistrict(),
                collector.getWard(),
                collector.getHub().getHubId(),
                collector.getHub().getName()
        );
    }

    private EmployeeDetailDTO convertToResponseDDTO(Driver collector) {

        return new EmployeeDetailDTO(
                collector.getId(),
                collector.getName(),
                collector.getUsername(),
                collector.getPassword(),
                collector.getEmail(),
                collector.getPhone(),
                collector.getAddress(),
                collector.getCity(),
                collector.getDistrict(),
                collector.getWard(),
                collector.getOriginHub().getHubId(),
                collector.getOriginHub().getName()
        );
    }


}
