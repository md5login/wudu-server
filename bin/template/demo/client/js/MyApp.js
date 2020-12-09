class Plan {
    name;
    businessManagement = false;
    maxWorkers;
    generalStatistics = false;
    broadStatistics = false;
    trialPeriod = 0;
    pricePerMonth;
    pricePerYear;
    appearsInSearch = false;
    customersCanManageSchedule = false;
    media = false;
    instantNotifications = false;
    creditCardPayment = false;
}

const basicPlan = new Plan();
basicPlan.id = 'basic';
basicPlan.name = '{{plans.basic}}';
basicPlan.generalStatistics = true;
basicPlan.maxWorkers = 2;
basicPlan.businessManagement = true;
basicPlan.pricePerMonth = 0;


const proPlan = new Plan();
proPlan.id = 'pro';
proPlan.name = '{{plans.pro}}';
proPlan.broadStatistics = true;
proPlan.maxWorkers = 6;
proPlan.businessManagement = true;
proPlan.trialPeriod = 1;
proPlan.pricePerMonth = 259;
proPlan.pricePerYear = 2900;
proPlan.customersCanManageSchedule = true;
proPlan.media = true;
proPlan.creditCardPayment = true;
proPlan.instantNotifications = true;
proPlan.appearsInSearch = true;

const plans = [basicPlan, proPlan];

export default plans;