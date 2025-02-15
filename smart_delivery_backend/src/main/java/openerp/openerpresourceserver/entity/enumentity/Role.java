package openerp.openerpresourceserver.entity.enumentity;

public enum Role {
        SHIPPER, COLLECTOR, DRIVER;
        public String toKeycloakRole() {
                return this.name();
        }
}
