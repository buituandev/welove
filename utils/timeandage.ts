export const calculateDaysLeft = (birthDateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birthDate = new Date(birthDateString);
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = Math.abs(thisYearBirthday.getTime() - today.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};