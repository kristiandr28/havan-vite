import React from 'react';
import { useTranslation } from 'react-i18next'; // <-- Tambahkan ini
import { Link } from 'react-router-dom';
import { BiHome, BiMap, BiReceipt, BiWalk, BiPin, BiImage, BiInfoCircle, BiPhone, BiGridAlt, BiLogIn, BiMenu } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';

function NavMenu({ user, isNavOpen, setIsNavOpen, handleTicketsClick, handleAboutClick, handleContactClick, handleLoginClick }) {
    const { t } = useTranslation(); // <-- Tambahkan ini
    const toggleNav = () => setIsNavOpen(!isNavOpen);

    const navVariants = {
        hidden: {
            opacity: 0,
            x: "100%",
            transition: {
                type: "tween",
                duration: 0.3,
                ease: "easeOut"
            }
        },
        visible: {
            opacity: 1,
            x: "0%",
            transition: {
                type: "tween",
                duration: 0.3,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.05
            }
        },
        exit: {
            opacity: 0,
            x: "100%",
            transition: {
                type: "tween",
                duration: 0.3,
                ease: "easeIn"
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
    };

    const NavMenuItem = ({ to, onClick, icon: Icon, label, showOnMobileOnly = false }) => (
        <motion.li className={`flex items-center ${showOnMobileOnly ? 'sm:hidden' : ''}`} variants={itemVariants}>
            {Icon && <Icon className="text-gray-600 mr-1 sm:text-base text-[14px]" />}
            {to ? (
                <Link to={to} className="text-gray-600 hover:text-havanaBlue sm:text-base text-[14px]" onClick={() => setIsNavOpen(false)}>
                    {label}
                </Link>
            ) : (
                <button
                    onClick={() => {
                        if (typeof onClick === 'function') {
                            onClick();
                        } else {
                            console.error('NavMenuItem: onClick prop is not a function for label:', label);
                        }
                        setIsNavOpen(false);
                    }}
                    className="text-gray-600 hover:text-havanaBlue sm:text-base text-[14px]"
                >
                    {label}
                </button>
            )}
        </motion.li>
    );

    return (
        <>
            <div className="flex items-center sm:hidden">
                <button
                    onClick={toggleNav}
                    className="p-2 text-gray-600 hover:text-havanaBlue"
                    aria-label={isNavOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                >
                    <BiMenu className="text-3xl" />
                </button>
            </div>

            <AnimatePresence>
                {isNavOpen && (
                    <motion.nav
                        className="fixed inset-0 bg-white sm:hidden z-20 overflow-y-auto"
                        variants={navVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="flex justify-end p-4">
                            <button
                                onClick={toggleNav}
                                className="p-2 text-gray-600 hover:text-havanaBlue"
                                aria-label={t('nav.closeMenu')}
                            >
                                <BiMenu className="text-3xl" />
                            </button>
                        </div>
                        <ul className="flex flex-col space-y-4 p-4">
                            <NavMenuItem to="/" icon={BiHome} label={t('nav.home')} />
                            <NavMenuItem to="/tours" icon={BiMap} label={t('nav.tours')} />
                            <NavMenuItem onClick={handleTicketsClick} icon={BiReceipt} label={t('nav.tickets')} />
                            <NavMenuItem to="/activities" icon={BiWalk} label={t('nav.activities')} />
                            <NavMenuItem to="/destinations" icon={BiPin} label={t('nav.destinations')} />
                            <NavMenuItem to="/gallery" icon={BiImage} label={t('nav.gallery')} />
                            {/* <NavMenuItem onClick={handleAboutClick} icon={BiInfoCircle} label={t('nav.about')} /> */}
                            <motion.li className="flex items-center" variants={itemVariants}>
                                <BiPhone className="text-gray-600 mr-1 sm:text-base text-[14px]" />
                                <button
                                    onClick={() => {
                                        handleContactClick();
                                        setIsNavOpen(false);
                                    }}
                                    className="text-gray-600 hover:text-havanaBlue sm:text-base text-[14px]"
                                >
                                    {t('nav.contact')}
                                </button>
                            </motion.li>
                            {user && user.role === 'admin' && (
                                <NavMenuItem to="/admin/dashboard" icon={BiGridAlt} label={t('nav.dashboard')} />
                            )}
                            {!user && (
                                <motion.li className="flex items-center sm:hidden" variants={itemVariants}>
                                    <BiLogIn className="text-gray-600 mr-1 text-[14px]" />
                                    <button
                                        onClick={() => {
                                            handleLoginClick();
                                            setIsNavOpen(false);
                                        }}
                                        className="text-gray-600 hover:text-havanaBlue text-[14px]"
                                    >
                                        {t('nav.loginRegister')}
                                    </button>
                                </motion.li>
                            )}
                        </ul>
                    </motion.nav>
                )}
            </AnimatePresence>

            <nav className="hidden sm:block">
                <ul className="flex flex-row sm:space-x-4 lg:space-x-6">
                    <NavMenuItem to="/" icon={BiHome} label={t('nav.home')} />
                    <NavMenuItem to="/tours" icon={BiMap} label={t('nav.tours')} />
                    <NavMenuItem onClick={handleTicketsClick} icon={BiReceipt} label={t('nav.tickets')} />
                    <NavMenuItem to="/activities" icon={BiWalk} label={t('nav.activities')} />
                    <NavMenuItem to="/destinations" icon={BiPin} label={t('nav.destinations')} />
                    <NavMenuItem to="/gallery" icon={BiImage} label={t('nav.gallery')} />
                    {/* <NavMenuItem onClick={handleAboutClick} icon={BiInfoCircle} label={t('nav.about')} /> */}
                    <li className="flex items-center">
                        <BiPhone className="text-gray-600 mr-1 sm:text-base text-[14px]" />
                        <button
                            onClick={() => {
                                handleContactClick();
                            }}
                            className="text-gray-600 hover:text-havanaBlue sm:text-base text-[14px]"
                        >
                            {t('nav.contact')}
                        </button>
                    </li>
                    {user && user.role === 'admin' && (
                        <NavMenuItem to="/admin/dashboard" icon={BiGridAlt} label={t('nav.dashboard')} />
                    )}
                </ul>
            </nav>
        </>
    );
}

export default NavMenu;