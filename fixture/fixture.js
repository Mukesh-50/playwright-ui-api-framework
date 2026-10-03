import{test as base,expect} from "@playwright/test"

import { LoginPage } from "../pages/loginpage.js"

import {DashBoardPage} from "../pages/dashboardpage.js"

import {CoursePage} from "../pages/coursepage.js";

import { BookingApi } from "../api/services/booking.api.js"

import { AuthApi } from "../api/services/auth.api.js"

/**
 * Types for the fixtures below (editor autocomplete and @ts-check only, no runtime effect)
 * @typedef {Object} Fixtures
 * @property {LoginPage} loginPage
 * @property {LoginPage} loggedInUser
 * @property {LoginPage} loggedInOnce
 * @property {DashBoardPage} dashboardPage
 * @property {*} registrationPage
 * @property {CoursePage} coursePage
 * @property {BookingApi} bookingApi
 * @property {AuthApi} authApi
 */

/**
 * @typedef {import("@playwright/test").TestType<
 *   import("@playwright/test").PlaywrightTestArgs &
 *   import("@playwright/test").PlaywrightTestOptions & Fixtures,
 *   import("@playwright/test").PlaywrightWorkerArgs &
 *   import("@playwright/test").PlaywrightWorkerOptions
 * >} TestWithFixtures
 */

const test=/** @type {TestWithFixtures} */ (base.extend({

            loginPage:async ({page},use)=>
            {
                const loginPage=new LoginPage(page)

                await use(loginPage)

            }
            ,

             loggedInUser:async ({page},use)=>
            {
                const loginPage=new LoginPage(page)

                await loginPage.goto("/login")

                await loginPage.loginToApplication("admin@email.com","admin@123") // this has to come from config or env file or json file

                await use(loginPage)

                const dashboardPage=new DashBoardPage(page)

                await dashboardPage.logoutFromApplication()

            },

              loggedInOnce:async ({page},use)=>
            {
                const loginPage=new LoginPage(page)

                await loginPage.goto("/login")

                await loginPage.loginToApplication("admin@email.com","admin@123") // this has to come from config or env file or json file

                await use(loginPage)

            }
            ,

            dashboardPage: async ({page},use)=>{

                const dashboardPage=new DashBoardPage(page)

                await use(dashboardPage)

            },

            registrationPage: async ({page},use)=>{

                const registrationPage=new RegistrationPage(page)

                await use(registrationPage)

            },

            coursePage: async ({page},use)=>{

                const coursePage=new CoursePage(page)

                await use(coursePage)

            },

            // API fixtures use "request", so API tests never open a browser

            bookingApi: async ({request},use)=>{

                const bookingApi=new BookingApi(request)

                await use(bookingApi)

            },

            authApi: async ({request},use)=>{

                const authApi=new AuthApi(request)

                await use(authApi)

            }


}))

export {test,expect}