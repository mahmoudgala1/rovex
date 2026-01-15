import { MANAGEMENT_ROLES } from "../utils/permissions";
import { FLEET_MANAGMENT_ROLES } from "../utils/permissions";
export const generateRoleBasedQuery = (role:string,user_id:string ,company:string) =>
{

   let query;
    if(role == "customer")
    {
       query= {user:user_id,company :company} 
    }
    else if(MANAGEMENT_ROLES.includes(role))
    {
       query= {company:company} 
    }
    else if(FLEET_MANAGMENT_ROLES.includes(role))
    {
       query={}
    }
    return query;
}
