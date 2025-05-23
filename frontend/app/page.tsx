import Image from "next/image";
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { IntroTools } from "./uIComponents/IntroTools";

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}
const navigation = [
  { name: 'Ai Tools', href: '#', current: true },
  { name: 'Agents', href: '#', current: false },
]
const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}


export default function Home() {
  return (
    <>

      <div className="min-h-full ">
        <Disclosure as="nav" className="bg-white/30 backdrop-blur-lg border-b border-white/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0">
                  <img
                    alt="44.01 LIMITED"
                    src="/logo.svg"
                    className="size-16"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current ? 'bg-white/20 text-gray-900' : 'text-gray-900 hover:bg-white/20',
                          'rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="relative rounded-full bg-white/20 p-1 text-gray-900 hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-white/20 focus:outline-hidden transition-all duration-200"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <MenuButton className="relative flex max-w-xs items-center rounded-full bg-white/20 text-sm focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-white/20 focus:outline-hidden transition-all duration-200">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <img alt="" src={user.imageUrl} className="size-8 rounded-full" />
                      </MenuButton>
                    </div>
                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white/80 backdrop-blur-lg py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name}>
                          <a
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-900 hover:bg-white/50 data-focus:bg-white/50 data-focus:outline-hidden transition-all duration-200"
                          >
                            {item.name}
                          </a>
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-white/20 p-2 text-gray-900 hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-white/20 focus:outline-hidden transition-all duration-200">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="md:hidden bg-white/80 backdrop-blur-lg">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current ? 'bg-white/20 text-gray-900' : 'text-gray-900 hover:bg-white/20',
                    'block rounded-md px-3 py-2 text-base font-medium transition-all duration-200',
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-white/20 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  <img alt="" src={user.imageUrl} className="size-10 rounded-full" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm font-medium text-gray-700">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full bg-white/20 p-1 text-gray-900 hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-white/20 focus:outline-hidden transition-all duration-200"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-white/20 transition-all duration-200"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

        {/* <header className=" shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg/6 font-semibold text-gray-900">Agents</h1>
        </div>
      </header> */}
        <main>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

            <IntroTools />

          </div>
        </main>
      </div>
    </>
  );
}
