package openerp.openerpresourceserver.controller;

import jakarta.ws.rs.BadRequestException;
import openerp.openerpresourceserver.entity.Collector;
import openerp.openerpresourceserver.entity.Driver;
import openerp.openerpresourceserver.entity.Shipper;
import openerp.openerpresourceserver.request.EmployeeRequest;
import openerp.openerpresourceserver.response.EmployeeDetailDTO;
import openerp.openerpresourceserver.service.HumanResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/smdeli/humanresource")
public class HumanResourceController {

    @Autowired
    private HumanResourceService humanResourceService;

    //endpoint cho shipper
    @GetMapping("/shipper")
    public List<Shipper> getAllShipper() {
        List<Shipper> shippers = humanResourceService.getAllShipper();
        return shippers;
    }

    @GetMapping("/shipper/{id}")
    public EmployeeDetailDTO getShipperById(@PathVariable UUID id) {
        return humanResourceService.getShipperById(id);
    }
    @PostMapping("/shiper/{id}")
    public Shipper updateShipper(@PathVariable UUID id, @RequestBody Shipper shipper) {
        return null;
    }

    @DeleteMapping("/shipper/{id}")
    public void deleteShipper(@PathVariable UUID id) {
        humanResourceService.deleteShipper(id);
    }

    //endpoint cho collector
    @GetMapping("/collector")
    public List<Collector> getAllCollector() {
        List<Collector> collectors = humanResourceService.getAllCollector();
        return collectors;
    }

    @GetMapping("/collector/{id}")
    public EmployeeDetailDTO getCollectorById(@PathVariable UUID id) {
        return humanResourceService.getCollectorById(id);
    }

    @PostMapping("/collector/{id}")
    public Collector updateCollector(@PathVariable UUID id, @RequestBody Collector collector) {
        return null;
    }

    @DeleteMapping("/collector/{id}")
    public void deleteCollector(@PathVariable UUID id) {
        humanResourceService.deleteCollector(id);
    }

    //endpoint cho driver
    @GetMapping("/driver")
    public List<Driver> getAllDriver() {
        List<Driver> drivers = humanResourceService.getAllDriver();
        return drivers;
    }

    @GetMapping("/driver/{id}")
    public EmployeeDetailDTO getDriverById(@PathVariable UUID id) {
        return humanResourceService.getDriverById(id);
    }

    @PostMapping("/driver/{id}")
    public Driver updateDriver(@PathVariable UUID id, @RequestBody Driver driver) {
        return null;
    }

    @DeleteMapping("/driver/{id}")
    public void deleteDriver(@PathVariable UUID id) {
        humanResourceService.deleteDriver(id);
    }

    @PostMapping("/add")
    public void addEmployee(@RequestBody EmployeeRequest employeeRequest) {
         humanResourceService.addEmployee(employeeRequest);
    }
    @PutMapping("/update")
    public void updateEmployee(@RequestBody EmployeeRequest employeeRequest) {
        try {
            if (employeeRequest.getId() != null) {
                // Gọi service để thực hiện cập nhật
                humanResourceService.updateEmployee(employeeRequest);
            }
           else throw new BadRequestException("id is null");
        } catch (Exception e) {
        }
    }



}
